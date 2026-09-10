from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated, Optional
from uuid import uuid4

import json
import os
import secrets
import sqlite3

from dotenv import load_dotenv

from fastapi import (
    Depends,
    FastAPI,
    File,
    Header,
    HTTPException,
    Request,
    UploadFile,
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from pydantic import BaseModel, Field


# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

BASE_DIR = (
    Path(__file__)
    .resolve()
    .parent
)

PROJECT_ROOT = BASE_DIR.parent

DATABASE_PATH = (
    BASE_DIR /
    "sal_y_sol.db"
)

UPLOADS_DIR = (
    BASE_DIR /
    "uploads"
)


# ---------------------------------------------------------
# ENVIRONMENT
# ---------------------------------------------------------

load_dotenv(
    PROJECT_ROOT /
    ".env"
)


def get_allowed_origins():
    configured_origins = os.getenv(
        "ALLOWED_ORIGINS",
        "",
    )

    origins = [
        origin.strip()
        for origin in configured_origins.split(",")
        if origin.strip()
    ]

    local_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    for origin in local_origins:
        if origin not in origins:
            origins.append(origin)

    return origins


# ---------------------------------------------------------
# DATABASE
# ---------------------------------------------------------

def get_db():
    connection = sqlite3.connect(
        DATABASE_PATH
    )

    connection.row_factory = (
        sqlite3.Row
    )

    return connection


def create_tables():
    connection = get_db()

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            price INTEGER NOT NULL,
            image TEXT DEFAULT '',
            sizes TEXT DEFAULT '[]',
            colors TEXT DEFAULT '[]',
            stock INTEGER DEFAULT 0,
            featured INTEGER DEFAULT 0,
            active INTEGER DEFAULT 1
        )
        """
    )

    connection.commit()
    connection.close()


# ---------------------------------------------------------
# PYDANTIC MODELS
# ---------------------------------------------------------

class ProductCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100,
    )

    description: str = ""

    price: int = Field(
        gt=0
    )

    image: str = ""

    sizes: list[str] = Field(
        default_factory=list
    )

    colors: list[str] = Field(
        default_factory=list
    )

    stock: int = Field(
        default=0,
        ge=0,
    )

    featured: bool = False
    active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    description: Optional[str] = None

    price: Optional[int] = Field(
        default=None,
        gt=0,
    )

    image: Optional[str] = None

    sizes: Optional[
        list[str]
    ] = None

    colors: Optional[
        list[str]
    ] = None

    stock: Optional[int] = Field(
        default=None,
        ge=0,
    )

    featured: Optional[
        bool
    ] = None

    active: Optional[
        bool
    ] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    price: int
    image: str

    sizes: list[str]
    colors: list[str]

    stock: int
    featured: bool
    active: bool


# ---------------------------------------------------------
# HELPERS
# ---------------------------------------------------------

def row_to_product(
    row: sqlite3.Row
) -> dict:
    return {
        "id":
            row["id"],

        "name":
            row["name"],

        "description":
            row["description"],

        "price":
            row["price"],

        "image":
            row["image"],

        "sizes":
            json.loads(
                row["sizes"]
            ),

        "colors":
            json.loads(
                row["colors"]
            ),

        "stock":
            row["stock"],

        "featured":
            bool(
                row["featured"]
            ),

        "active":
            bool(
                row["active"]
            ),
    }


# ---------------------------------------------------------
# ADMIN SECURITY
# ---------------------------------------------------------

def require_admin(
    x_admin_key: Annotated[
        Optional[str],
        Header()
    ] = None,
):
    expected_key = os.getenv(
        "ADMIN_KEY"
    )

    if not expected_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "ADMIN_KEY is not configured."
            ),
        )

    if not x_admin_key:
        raise HTTPException(
            status_code=401,
            detail=(
                "Admin key required."
            ),
        )

    if not secrets.compare_digest(
        x_admin_key,
        expected_key,
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid admin key."
            ),
        )

    return True


# ---------------------------------------------------------
# STARTUP
# ---------------------------------------------------------

@asynccontextmanager
async def lifespan(
    app: FastAPI
):
    UPLOADS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    create_tables()

    yield


# ---------------------------------------------------------
# APP
# ---------------------------------------------------------

app = FastAPI(
    title="Sal y Sol Swim API",
    description=(
        "Backend API for "
        "Sal y Sol Swim"
    ),
    version="1.2.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------
# STATIC UPLOADS
# ---------------------------------------------------------

UPLOADS_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

app.mount(
    "/uploads",
    StaticFiles(
        directory=UPLOADS_DIR
    ),
    name="uploads",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,

    allow_origins=
        get_allowed_origins(),

    allow_credentials=True,

    allow_methods=[
        "*"
    ],

    allow_headers=[
        "*"
    ],
)


# ---------------------------------------------------------
# HOME / HEALTH
# ---------------------------------------------------------

@app.get("/")
def home():
    return {
        "message":
            "Sal y Sol Swim API is running",

        "status":
            "ok",
    }


@app.get("/health")
def health():
    return {
        "status":
            "healthy"
    }


# ---------------------------------------------------------
# ADMIN AUTH CHECK
# ---------------------------------------------------------

@app.get(
    "/admin/check",
    dependencies=[
        Depends(
            require_admin
        )
    ],
)
def admin_check():
    return {
        "authenticated":
            True
    }


# ---------------------------------------------------------
# PUBLIC PRODUCTS
# ONLY ACTIVE PRODUCTS
# ---------------------------------------------------------

@app.get(
    "/products",
    response_model=
        list[
            ProductResponse
        ],
)
def get_products(
    featured: Optional[
        bool
    ] = None,
):
    connection = get_db()

    query = """
        SELECT *
        FROM products
        WHERE active = 1
    """

    parameters = []

    if featured is not None:
        query += (
            " AND featured = ?"
        )

        parameters.append(
            int(featured)
        )

    query += (
        " ORDER BY id DESC"
    )

    rows = (
        connection.execute(
            query,
            parameters,
        )
        .fetchall()
    )

    connection.close()

    return [
        row_to_product(row)
        for row in rows
    ]


# ---------------------------------------------------------
# PUBLIC SINGLE PRODUCT
# ONLY ACTIVE PRODUCT
# ---------------------------------------------------------

@app.get(
    "/products/{product_id}",
    response_model=
        ProductResponse,
)
def get_product(
    product_id: int
):
    connection = get_db()

    row = (
        connection.execute(
            """
            SELECT *
            FROM products
            WHERE id = ?
            AND active = 1
            """,
            (
                product_id,
            ),
        )
        .fetchone()
    )

    connection.close()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Product not found"
            ),
        )

    return row_to_product(
        row
    )


# ---------------------------------------------------------
# ADMIN PRODUCTS
# RETURNS ACTIVE + INACTIVE
# ---------------------------------------------------------

@app.get(
    "/admin/products",
    response_model=
        list[
            ProductResponse
        ],
    dependencies=[
        Depends(
            require_admin
        )
    ],
)
def get_admin_products():
    connection = get_db()

    rows = (
        connection.execute(
            """
            SELECT *
            FROM products
            ORDER BY id DESC
            """
        )
        .fetchall()
    )

    connection.close()

    return [
        row_to_product(row)
        for row in rows
    ]


# ---------------------------------------------------------
# CREATE PRODUCT
# ADMIN ONLY
# ---------------------------------------------------------

@app.post(
    "/products",
    response_model=
        ProductResponse,
    status_code=201,
    dependencies=[
        Depends(
            require_admin
        )
    ],
)
def create_product(
    product: ProductCreate
):
    connection = get_db()

    cursor = (
        connection.execute(
            """
            INSERT INTO products (
                name,
                description,
                price,
                image,
                sizes,
                colors,
                stock,
                featured,
                active
            )
            VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?
            )
            """,
            (
                product.name,

                product.description,

                product.price,

                product.image,

                json.dumps(
                    product.sizes
                ),

                json.dumps(
                    product.colors
                ),

                product.stock,

                int(
                    product.featured
                ),

                int(
                    product.active
                ),
            ),
        )
    )

    connection.commit()

    product_id = (
        cursor.lastrowid
    )

    row = (
        connection.execute(
            """
            SELECT *
            FROM products
            WHERE id = ?
            """,
            (
                product_id,
            ),
        )
        .fetchone()
    )

    connection.close()

    return row_to_product(
        row
    )


# ---------------------------------------------------------
# UPDATE PRODUCT
# ADMIN ONLY
# ---------------------------------------------------------

@app.put(
    "/products/{product_id}",
    response_model=
        ProductResponse,
    dependencies=[
        Depends(
            require_admin
        )
    ],
)
def update_product(
    product_id: int,
    product: ProductUpdate,
):
    connection = get_db()

    existing = (
        connection.execute(
            """
            SELECT *
            FROM products
            WHERE id = ?
            """,
            (
                product_id,
            ),
        )
        .fetchone()
    )

    if existing is None:
        connection.close()

        raise HTTPException(
            status_code=404,
            detail=(
                "Product not found"
            ),
        )

    update_data = (
        product.model_dump(
            exclude_unset=True
        )
    )

    if not update_data:
        connection.close()

        return row_to_product(
            existing
        )

    fields = []
    values = []

    for (
        field,
        value
    ) in update_data.items():

        if field in {
            "sizes",
            "colors",
        }:
            value = json.dumps(
                value
            )

        if field in {
            "featured",
            "active",
        }:
            value = int(
                value
            )

        fields.append(
            f"{field} = ?"
        )

        values.append(
            value
        )

    values.append(
        product_id
    )

    connection.execute(
        f"""
        UPDATE products
        SET {", ".join(fields)}
        WHERE id = ?
        """,
        values,
    )

    connection.commit()

    row = (
        connection.execute(
            """
            SELECT *
            FROM products
            WHERE id = ?
            """,
            (
                product_id,
            ),
        )
        .fetchone()
    )

    connection.close()

    return row_to_product(
        row
    )


# ---------------------------------------------------------
# DELETE PRODUCT
# ADMIN ONLY
# ---------------------------------------------------------

@app.delete(
    "/products/{product_id}",
    dependencies=[
        Depends(
            require_admin
        )
    ],
)
def delete_product(
    product_id: int
):
    connection = get_db()

    existing = (
        connection.execute(
            """
            SELECT *
            FROM products
            WHERE id = ?
            """,
            (
                product_id,
            ),
        )
        .fetchone()
    )

    if existing is None:
        connection.close()

        raise HTTPException(
            status_code=404,
            detail=(
                "Product not found"
            ),
        )

    connection.execute(
        """
        DELETE FROM products
        WHERE id = ?
        """,
        (
            product_id,
        ),
    )

    connection.commit()
    connection.close()

    return {
        "message":
            "Product deleted successfully",

        "product_id":
            product_id,
    }


# ---------------------------------------------------------
# IMAGE UPLOAD
# ADMIN ONLY
# ---------------------------------------------------------

@app.post(
    "/admin/upload-image",
    dependencies=[
        Depends(
            require_admin
        )
    ],
)
async def upload_image(
    request: Request,

    file: UploadFile =
        File(...),
):
    allowed_types = {
        "image/jpeg":
            ".jpg",

        "image/png":
            ".png",

        "image/webp":
            ".webp",
    }

    if (
        file.content_type
        not in allowed_types
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPG, PNG "
                "and WEBP images "
                "are allowed."
            ),
        )

    contents = (
        await file.read()
    )

    max_size = (
        5 *
        1024 *
        1024
    )

    if (
        len(contents) >
        max_size
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Image must be "
                "5 MB or smaller."
            ),
        )

    extension = (
        allowed_types[
            file.content_type
        ]
    )

    filename = (
        f"{uuid4().hex}"
        f"{extension}"
    )

    destination = (
        UPLOADS_DIR /
        filename
    )

    destination.write_bytes(
        contents
    )

    public_base_url = os.getenv(
        "PUBLIC_BASE_URL"
    )

    if public_base_url:
        base_url = (
            public_base_url
            .rstrip("/")
        )
    else:
        base_url = (
            str(
                request.base_url
            )
            .rstrip("/")
        )

    image_url = (
        f"{base_url}"
        f"/uploads/"
        f"{filename}"
    )

    return {
        "filename":
            filename,

        "url":
            image_url,
    }