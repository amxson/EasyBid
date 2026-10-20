import { useEffect, useRef, useState } from "react";
import { imageError } from "@/lib/forms";

async function checkImage(file) {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    bitmap.close();
    return;
  }
  const url = URL.createObjectURL(file);
  try {
    await new Promise((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => reject(new Error("Image check timed out.")), 10000);
      image.onload = () => { clearTimeout(timer); resolve(); };
      image.onerror = () => { clearTimeout(timer); reject(new Error("Invalid image.")); };
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function useImageUpload() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const selection = useRef(0);
  useEffect(() => () => { selection.current += 1; }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function onChange(event) {
    const input = event.target;
    const candidate = input.files?.[0];
    const current = ++selection.current;
    setFile(null);
    setPreview("");
    setChecking(false);
    const problem = imageError(candidate);
    setError(candidate ? problem : "");
    if (!candidate || problem) { input.value = ""; return; }
    setChecking(true);
    let timer;
    try {
      await Promise.race([
        checkImage(candidate),
        new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error("Image check timed out.")), 10000); }),
      ]);
      if (current !== selection.current) return;
      setFile(candidate);
      setPreview(URL.createObjectURL(candidate));
    } catch {
      if (current !== selection.current) return;
      input.value = "";
      setError("This file is not a readable image. Choose another JPEG, PNG, or WebP image.");
    } finally {
      clearTimeout(timer);
      if (current === selection.current) setChecking(false);
    }
  }
  return { file, preview, error, checking, onChange };
}
