# qr_generation.py
from pathlib import Path
import qrcode

DEFAULT_GDRIVE_URL = "https://drive.google.com/drive/folders/1-LgtNoOv7f_avbl-qwPoPnD-HCZ_usXt?usp=sharing"
QR_FILENAME = "Hasil.png"

def _default_output_path() -> Path:
    # module is in src/server/, so project root is parents[2]
    project_root = Path(__file__).resolve().parents[2]
    out_dir = project_root / "public"
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir / QR_FILENAME

def generate_qr_png(
    data: str = DEFAULT_GDRIVE_URL,
    out_path: Path | None = None,
    box_size: int = 12,
    border: int = 4,
):
    """
    Generates/overwrites Hasil.png (or a provided path). Returns the output path.
    No side effects occur unless this function is called.
    """
    if out_path is None:
        out_path = _default_output_path()

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=box_size,
        border=border,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(out_path)
    return out_path

if __name__ == "__main__":
    # Optional: allow manual CLI run
    p = generate_qr_png()
    print(f"Wrote QR to: {p}")
