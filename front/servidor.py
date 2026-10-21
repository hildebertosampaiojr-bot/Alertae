"""Servidor local para o protótipo Alertaê."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent


class FrontendHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PROJECT_ROOT), **kwargs)

    def do_GET(self):
        if self.path == "/":
            self.send_response(302)
            self.send_header("Location", "/html/index.html")
            self.end_headers()
            return

        super().do_GET()


if __name__ == "__main__":
    address = ("127.0.0.1", 8000)
    print(f"Alertaê disponível em http://{address[0]}:{address[1]}")
    print("Pressione Ctrl+C para encerrar.")
    ThreadingHTTPServer(address, FrontendHandler).serve_forever()
