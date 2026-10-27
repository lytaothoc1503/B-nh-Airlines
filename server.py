"""Local development server. Not a public production deployment."""
import hashlib
import json
import re
import secrets
import sqlite3
import threading
import time
from contextlib import closing
from datetime import date, datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

BASE = Path(__file__).resolve().parent
DATA = BASE / "private"
DATABASE = DATA / "requests.sqlite3"
HOST, PORT = "127.0.0.1", 8000
ORIGIN = f"http://{HOST}:{PORT}"
AIRPORTS = {"HAN", "SGN", "DAD"}
PUBLIC = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/index.html": ("index.html", "text/html; charset=utf-8"),
    "/style.css": ("style.css", "text/css; charset=utf-8"),
    "/anime.umd.min.js": ("anime.umd.min.js", "text/javascript; charset=utf-8"),
    "/app.js": ("app.js", "text/javascript; charset=utf-8"),
}
RATE_LOCK = threading.Lock()
ATTEMPTS = []


def init_db():
    DATA.mkdir(exist_ok=True)
    with sqlite3.connect(DATABASE) as db:
        db.execute("""CREATE TABLE IF NOT EXISTS requests (
            reference TEXT PRIMARY KEY,
            request_key TEXT NOT NULL UNIQUE,
            payload_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            origin TEXT NOT NULL,
            destination TEXT NOT NULL,
            departure_date TEXT NOT NULL,
            return_date TEXT,
            passengers INTEGER NOT NULL,
            consent_at TEXT NOT NULL
        )""")


def field(data, key, maximum):
    value = data.get(key)
    if not isinstance(value, str):
        raise ValueError(f"Truong {key} khong hop le.")
    value = value.strip()
    if not value or len(value) > maximum or any(ord(c) < 32 for c in value):
        raise ValueError(f"Truong {key} bi thieu hoac khong hop le.")
    return value


def validate(data):
    if not isinstance(data, dict):
        raise ValueError("Du lieu phai la mot doi tuong JSON.")
    name = field(data, "name", 100)
    phone = field(data, "phone", 25)
    if len(name) < 2:
        raise ValueError("Ho ten phai co it nhat 2 ky tu.")
    if not re.fullmatch(r"\+?[0-9 ()-]{8,25}", phone):
        raise ValueError("So dien thoai khong hop le.")
    if not 8 <= len(re.sub(r"\D", "", phone)) <= 15:
        raise ValueError("So dien thoai can 8 den 15 chu so.")
    origin = field(data, "origin", 3)
    destination = field(data, "destination", 3)
    if origin not in AIRPORTS or destination not in AIRPORTS or origin == destination:
        raise ValueError("Diem di va diem den chua hop le.")
    departure_text = field(data, "departureDate", 10)
    try:
        departure = date.fromisoformat(departure_text)
    except ValueError:
        raise ValueError("Ngay di khong hop le.")
    if departure < date.today():
        raise ValueError("Ngay di khong duoc trong qua khu.")
    return_text = data.get("returnDate")
    if return_text in (None, ""):
        return_text = None
    else:
        return_text = field(data, "returnDate", 10)
        try:
            returning = date.fromisoformat(return_text)
        except ValueError:
            raise ValueError("Ngay ve khong hop le.")
        if returning < departure:
            raise ValueError("Ngay ve khong duoc truoc ngay di.")
        return_text = returning.isoformat()
    passengers = data.get("passengers")
    if type(passengers) is not int or not 1 <= passengers <= 9:
        raise ValueError("So nguoi lon phai la so nguyen tu 1 den 9.")
    if data.get("consent") is not True:
        raise ValueError("Can dong y de luu va xu ly yeu cau.")
    request_key = field(data, "requestKey", 32)
    if not re.fullmatch(r"[a-f0-9]{32}", request_key):
        raise ValueError("Ma chong trung khong hop le.")
    values = (name, phone, origin, destination, departure.isoformat(), return_text, passengers)
    digest = hashlib.sha256(json.dumps(values, ensure_ascii=False).encode()).hexdigest()
    return request_key, digest, values


class Handler(BaseHTTPRequestHandler):
    server_version = "BanhFuliLocal"
    sys_version = ""

    def reply(self, status, body, content_type="application/json; charset=utf-8"):
        if isinstance(body, dict):
            body = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'")
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(body)
        self.close_connection = True

    def valid_host(self):
        return self.headers.get("Host") == f"{HOST}:{PORT}"

    def do_GET(self):
        if not self.valid_host():
            self.reply(403, {"error": "Host khong hop le. Dung http://127.0.0.1:8000."})
            return
        path = urlsplit(self.path).path
        if path == "/api/health":
            self.reply(200, {"service": "bay-cung-banh-local", "status": "ok"})
            return
        if path not in PUBLIC:
            self.reply(404, {"error": "Khong tim thay tai nguyen."})
            return
        filename, content_type = PUBLIC[path]
        try:
            body = (BASE / filename).read_bytes()
        except OSError:
            self.reply(404, {"error": "Thieu tep giao dien."})
            return
        self.reply(200, body, content_type)

    def do_POST(self):
        if not self.valid_host() or self.headers.get("Origin") != ORIGIN:
            self.reply(403, {"error": "Nguon gui khong hop le. Mo http://127.0.0.1:8000."})
            return
        if urlsplit(self.path).path != "/api/requests":
            self.reply(404, {"error": "Khong tim thay chuc nang."})
            return
        if self.headers.get("Transfer-Encoding"):
            self.reply(400, {"error": "Kieu truyen khong duoc ho tro."})
            return
        if self.headers.get("Content-Type", "").split(";")[0].strip().lower() != "application/json":
            self.reply(415, {"error": "Chi chap nhan JSON."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if not 1 <= length <= 8192:
            self.reply(413, {"error": "Yeu cau trong hoac qua lon."})
            return
        now = time.monotonic()
        with RATE_LOCK:
            ATTEMPTS[:] = [t for t in ATTEMPTS if now - t < 60]
            limited = len(ATTEMPTS) >= 30
            if not limited:
                ATTEMPTS.append(now)
        if limited:
            self.reply(429, {"error": "Qua nhieu yeu cau. Thu lai sau mot phut."})
            return
        try:
            raw = self.rfile.read(length)
            if len(raw) != length:
                raise ValueError("Du lieu gui len chua day du.")
            data = json.loads(raw.decode("utf-8"))
            key, digest, values = validate(data)
        except OSError:
            self.close_connection = True
            return
        except (ValueError, UnicodeError) as exc:
            message = str(exc) if isinstance(exc, ValueError) and not isinstance(exc, json.JSONDecodeError) else "Du lieu JSON khong hop le."
            self.reply(400, {"error": message})
            return
        timestamp = datetime.now(timezone.utc).isoformat()
        reference = "REQ-" + secrets.token_hex(8).upper()
        try:
            with closing(sqlite3.connect(DATABASE, timeout=10)) as db, db:
                db.execute("BEGIN IMMEDIATE")
                existing = db.execute("SELECT reference, payload_hash FROM requests WHERE request_key = ?", (key,)).fetchone()
                if existing:
                    if existing[1] != digest:
                        self.reply(409, {"error": "Ma yeu cau da duoc dung cho thong tin khac."})
                    else:
                        self.reply(200, {"reference": existing[0], "status": "received"})
                    return
                db.execute("""INSERT INTO requests (
                    reference, request_key, payload_hash, created_at, status,
                    name, phone, origin, destination, departure_date,
                    return_date, passengers, consent_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (reference, key, digest, timestamp, "new", *values, timestamp))
        except sqlite3.Error:
            self.reply(503, {"error": "Chua the luu yeu cau. Vui long thu lai."})
            return
        self.reply(201, {"reference": reference, "status": "received"})

    def setup(self):
        super().setup()
        self.connection.settimeout(10)

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    init_db()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Banh Fuli - Bay Cung Banh, Bay Cung Bo: {ORIGIN} | Nhan Ctrl+C de dung.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
