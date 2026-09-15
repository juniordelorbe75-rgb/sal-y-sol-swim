from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated, Optional
from uuid import uuid4

import json
import os
import secrets
import sqlite3

import boto3
from botocore.config import Config
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
from psycopg import connect as pg_connect
from psycopg.rows import dict_row


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATABASE_PATH = BASE_DIR / "sal_y_sol.db"
UPLOADS_DIR = BASE_DIR / "uploads"

load_dotenv(PROJECT_ROOT / ".env")


def get_allowed_origins() -> list[str]:
    configured_origins = os.getenv("ALLOWED_ORIGINS", "")
    origins = [
        origin.strip().rstrip("/")
        for origin in configured_origins.split(",")
        if origin.strip()
    ]

    for origin in (
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ):
        if origin not in origins:
            origins.append(origin)

    return origins


def _database_url() -> str:
    value = (
        os.getenv("DATABASE_URL", "").strip()
        or os.getenv("RENDER_DATABASE_URL", "").strip()
    )
    if value.startswith("postgres://"):
        value = "postgresql://" + value.removeprefix("postgres://")
    if value.startswith("postgresql+psycopg://"):
        value = "postgresql://" + value.removeprefix("postgresql+psycopg://")
    return value


def using_postgres() -> bool:
    return bool(_database_url())


def get_db():
    url = _database_url()
    if url:
        return pg_connect(url, row_factory=dict_row)

    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def db_execute(connection, query: str, parameters=()):
    if using_postgres():
        query = query.replace("?", "%s")
    return connection.execute(query, parameters)


def db_bool(value: bool):
    return value if using_postgres() else int(value)


def create_tables() -> None:
    connection = get_db()
    try:
        if using_postgres():
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS products (
                    id BIGSERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    price INTEGER NOT NULL CHECK (price > 0),
                    image TEXT NOT NULL DEFAULT '',
                    sizes TEXT NOT NULL DEFAULT '[]',
                    colors TEXT NOT NULL DEFAULT '[]',
                    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
                    featured BOOLEAN NOT NULL DEFAULT FALSE,
                    active BOOLEAN NOT NULL DEFAULT TRUE
                )
                """
            )
        else:
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
    finally:
        connection.close()


class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str = ""
    price: int = Field(gt=0)
    image: str = ""
    sizes: list[str] = Field(default_factory=list)
    colors: list[str] = Field(default_factory=list)
    stock: int = Field(default=0, ge=0)
    featured: bool = False
    active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = None
    price: Optional[int] = Field(default=None, gt=0)
    image: Optional[str] = None
    sizes: Optional[list[str]] = None
    colors: Optional[list[str]] = None
    stock: Optional[int] = Field(default=None, ge=0)
    featured: Optional[bool] = None
    active: Optional[bool] = None


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


def row_to_product(row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "price": row["price"],
        "image": row["image"],
        "sizes": json.loads(row["sizes"] or "[]"),
        "colors": json.loads(row["colors"] or "[]"),
        "stock": row["stock"],
        "featured": bool(row["featured"]),
        "active": bool(row["active"]),
    }


def require_admin(
    x_admin_key: Annotated[Optional[str], Header()] = None,
):
    expected_key = os.getenv("ADMIN_KEY", "").strip()

    if not expected_key:
        raise HTTPException(
            status_code=503,
            detail="ADMIN_KEY is not configured.",
        )

    if not x_admin_key:
        raise HTTPException(
            status_code=401,
            detail="Admin key required.",
        )

    if not secrets.compare_digest(x_admin_key, expected_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid admin key.",
        )

    return True


def image_storage_mode() -> str:
    return os.getenv("IMAGE_STORAGE", "local").strip().lower()


def validate_image_storage() -> None:
    mode = image_storage_mode()
    if mode not in {"local", "r2"}:
        raise RuntimeError("IMAGE_STORAGE must be 'local' or 'r2'.")

    if mode == "r2":
        required = (
            "OBJECT_STORAGE_BUCKET",
            "OBJECT_STORAGE_ENDPOINT_URL",
            "OBJECT_STORAGE_ACCESS_KEY_ID",
            "OBJECT_STORAGE_SECRET_ACCESS_KEY",
            "OBJECT_STORAGE_PUBLIC_BASE_URL",
        )
        missing = [name for name in required if not os.getenv(name, "").strip()]
        if missing:
            raise RuntimeError(
                "Missing R2 settings: " + ", ".join(missing)
            )

        public_base = os.getenv("OBJECT_STORAGE_PUBLIC_BASE_URL", "").strip()
        endpoint = os.getenv("OBJECT_STORAGE_ENDPOINT_URL", "").strip()

        if not public_base.startswith("https://"):
            raise RuntimeError(
                "OBJECT_STORAGE_PUBLIC_BASE_URL must start with https://"
            )
        if not endpoint.startswith("https://"):
            raise RuntimeError(
                "OBJECT_STORAGE_ENDPOINT_URL must start with https://"
            )


def r2_client():
    return boto3.client(
        "s3",
        endpoint_url=os.getenv("OBJECT_STORAGE_ENDPOINT_URL", "").strip(),
        aws_access_key_id=os.getenv("OBJECT_STORAGE_ACCESS_KEY_ID", "").strip(),
        aws_secret_access_key=os.getenv(
            "OBJECT_STORAGE_SECRET_ACCESS_KEY", ""
        ).strip(),
        region_name=os.getenv("OBJECT_STORAGE_REGION", "auto").strip() or "auto",
        config=Config(signature_version="s3v4"),
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    create_tables()
    validate_image_storage()
    yield


app = FastAPI(
    title="Sal y Sol Swim API",
    description="Backend API for Sal y Sol Swim",
    version="2.0.0",
    lifespan=lifespan,
)

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount(
    "/uploads",
    StaticFiles(directory=UPLOADS_DIR),
    name="uploads",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Sal y Sol Swim API is running",
        "status": "ok",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/ready")
def ready():
    connection = get_db()
    try:
        db_execute(connection, "SELECT 1").fetchone()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database unavailable") from exc
    finally:
        connection.close()

    return {
        "status": "ready",
        "database": "postgresql" if using_postgres() else "sqlite",
        "image_storage": image_storage_mode(),
    }


@app.get(
    "/admin/check",
    dependencies=[Depends(require_admin)],
)
def admin_check():
    return {"authenticated": True}


@app.get(
    "/products",
    response_model=list[ProductResponse],
)
def get_products(featured: Optional[bool] = None):
    connection = get_db()
    try:
        query = """
            SELECT *
            FROM products
            WHERE active = ?
        """
        parameters = [db_bool(True)]

        if featured is not None:
            query += " AND featured = ?"
            parameters.append(db_bool(featured))

        query += " ORDER BY id DESC"
        rows = db_execute(connection, query, parameters).fetchall()
    finally:
        connection.close()

    return [row_to_product(row) for row in rows]


@app.get(
    "/products/{product_id}",
    response_model=ProductResponse,
)
def get_product(product_id: int):
    connection = get_db()
    try:
        row = db_execute(
            connection,
            """
            SELECT *
            FROM products
            WHERE id = ?
            AND active = ?
            """,
            (product_id, db_bool(True)),
        ).fetchone()
    finally:
        connection.close()

    if row is None:
        raise HTTPException(status_code=404, detail="Product not found")

    return row_to_product(row)


@app.get(
    "/admin/products",
    response_model=list[ProductResponse],
    dependencies=[Depends(require_admin)],
)
def get_admin_products():
    connection = get_db()
    try:
        rows = db_execute(
            connection,
            """
            SELECT *
            FROM products
            ORDER BY id DESC
            """,
        ).fetchall()
    finally:
        connection.close()

    return [row_to_product(row) for row in rows]


@app.post(
    "/products",
    response_model=ProductResponse,
    status_code=201,
    dependencies=[Depends(require_admin)],
)
def create_product(product: ProductCreate):
    connection = get_db()
    try:
        values = (
            product.name,
            product.description,
            product.price,
            product.image,
            json.dumps(product.sizes),
            json.dumps(product.colors),
            product.stock,
            db_bool(product.featured),
            db_bool(product.active),
        )

        query = """
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        if using_postgres():
            cursor = db_execute(connection, query + " RETURNING id", values)
            product_id = cursor.fetchone()["id"]
        else:
            cursor = db_execute(connection, query, values)
            product_id = cursor.lastrowid

        connection.commit()

        row = db_execute(
            connection,
            "SELECT * FROM products WHERE id = ?",
            (product_id,),
        ).fetchone()
    finally:
        connection.close()

    return row_to_product(row)


@app.put(
    "/products/{product_id}",
    response_model=ProductResponse,
    dependencies=[Depends(require_admin)],
)
def update_product(product_id: int, product: ProductUpdate):
    connection = get_db()
    try:
        existing = db_execute(
            connection,
            "SELECT * FROM products WHERE id = ?",
            (product_id,),
        ).fetchone()

        if existing is None:
            raise HTTPException(status_code=404, detail="Product not found")

        update_data = product.model_dump(exclude_unset=True)
        if not update_data:
            return row_to_product(existing)

        fields = []
        values = []

        for field, value in update_data.items():
            if field in {"sizes", "colors"}:
                value = json.dumps(value)
            elif field in {"featured", "active"}:
                value = db_bool(value)

            fields.append(f"{field} = ?")
            values.append(value)

        values.append(product_id)

        db_execute(
            connection,
            f"""
            UPDATE products
            SET {", ".join(fields)}
            WHERE id = ?
            """,
            values,
        )
        connection.commit()

        row = db_execute(
            connection,
            "SELECT * FROM products WHERE id = ?",
            (product_id,),
        ).fetchone()
    finally:
        connection.close()

    return row_to_product(row)


@app.delete(
    "/products/{product_id}",
    dependencies=[Depends(require_admin)],
)
def delete_product(product_id: int):
    connection = get_db()
    try:
        existing = db_execute(
            connection,
            "SELECT id FROM products WHERE id = ?",
            (product_id,),
        ).fetchone()

        if existing is None:
            raise HTTPException(status_code=404, detail="Product not found")

        db_execute(
            connection,
            "DELETE FROM products WHERE id = ?",
            (product_id,),
        )
        connection.commit()
    finally:
        connection.close()

    return {
        "message": "Product deleted successfully",
        "product_id": product_id,
    }


@app.post(
    "/admin/upload-image",
    dependencies=[Depends(require_admin)],
)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
):
    allowed_types = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are allowed.",
        )

    contents = await file.read()
    max_size = 5 * 1024 * 1024

    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail="Image must be 5 MB or smaller.",
        )

    extension = allowed_types[file.content_type]
    filename = f"{uuid4().hex}{extension}"

    if image_storage_mode() == "r2":
        key = f"products/{filename}"
        try:
            r2_client().put_object(
                Bucket=os.getenv("OBJECT_STORAGE_BUCKET", "").strip(),
                Key=key,
                Body=contents,
                ContentType=file.content_type,
                CacheControl="public, max-age=31536000",
            )
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail="Image storage upload failed.",
            ) from exc

        public_base = os.getenv(
            "OBJECT_STORAGE_PUBLIC_BASE_URL", ""
        ).strip().rstrip("/")

        return {
            "filename": filename,
            "url": f"{public_base}/{key}",
        }

    destination = UPLOADS_DIR / filename
    destination.write_bytes(contents)

    public_base_url = os.getenv("PUBLIC_BASE_URL", "").strip()
    base_url = (
        public_base_url.rstrip("/")
        if public_base_url
        else str(request.base_url).rstrip("/")
    )

    return {
        "filename": filename,
        "url": f"{base_url}/uploads/{filename}",
    }
