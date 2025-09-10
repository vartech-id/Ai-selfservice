# qr_generation.py
from pathlib import Path
import os
import qrcode

DEFAULT_GDRIVE_URL = "testing"
QR_FILENAME = "Hasil.png"

def _default_output_path() -> Path:
    project_root = Path(__file__).resolve().parents[2]
    out_dir = project_root / "public"
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir / QR_FILENAME

def _remove_case_insensitive(path: Path) -> None:
    """Remove any file in the directory whose name equals path.name ignoring case."""
    target = path.name.casefold()
    for p in path.parent.iterdir():
        if p.name.casefold() == target:
            p.unlink(missing_ok=True)
            break

def generate_qr_png(
    data: str = DEFAULT_GDRIVE_URL,
    out_path: Path | None = None,
    box_size: int = 12,
    border: int = 4,
):
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

    # Ensure Windows updates the filename casing
    _remove_case_insensitive(out_path)

    # Atomic-ish write: save to temp then replace
    tmp = out_path.with_suffix(out_path.suffix + ".tmp")
    img.save(tmp)
    os.replace(tmp, out_path)   # overwrites if exists

    return out_path

if __name__ == "__main__":
    p = generate_qr_png()
    print(f"Wrote QR to: {p}")
