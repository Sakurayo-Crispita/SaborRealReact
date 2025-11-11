// src/ProfileModal.jsx
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { apix } from "./api/api";

// Util: vista previa de imagen local (solo para UI)
function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function ProfileModal({ open, onClose }) {
  const { token, user, email, setUser } = useAuth(); // user puede venir de localStorage
  const [form, setForm] = useState({
    nombre: user?.nombre ?? "",
    telefono: user?.telefono ?? "",
    direccion: user?.direccion ?? "",
    genero: user?.genero ?? "na",
    fecha_nacimiento: user?.fecha_nacimiento ?? "",
  });
  const [avatar, setAvatar] = useState(""); // solo UI
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const passOldRef = useRef(null);
  const passNewRef = useRef(null);
  const passNew2Ref = useRef(null);

  // Sincroniza cuando se abre
  useEffect(() => {
    if (open) {
      setForm({
        nombre: user?.nombre ?? "",
        telefono: user?.telefono ?? "",
        direccion: user?.direccion ?? "",
        genero: user?.genero ?? "na",
        fecha_nacimiento: user?.fecha_nacimiento ?? "",
      });
      setAvatar(user?.avatarUrl || "");
      setMsg("");
    }
  }, [open, user]);

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMsg('El archivo debe ser una imagen.');
      return;
    }
    const dataUrl = await compressImage(file, 384, 0.72); // ~150–200 KB
    setAvatar(dataUrl); // previsualiza la versión comprimida
  };

  // Guardar perfil (envía solo campos soportados + avatarUrl si aplica)
  const saveProfile = async () => {
    setBusy(true); setMsg('');
    try {
      const payload = {
        nombre: form.nombre || undefined,
        telefono: form.telefono || undefined,
        direccion: form.direccion || undefined,
        genero: form.genero || undefined,
        fecha_nacimiento: form.fecha_nacimiento || undefined,
      };

      if (avatar && avatar.startsWith('data:image/') && avatar.length < 250_000) {
        payload.avatarUrl = avatar;
      }

      await apix.updateProfile(token, payload);

      // Refrescar /me para tener un user consistente (incluye avatarUrl si el backend lo guarda)
      const fresh = await apix.me(token);
      setUser?.(fresh);
      localStorage.setItem('sr_user', JSON.stringify(fresh));

      setMsg('✅ Perfil actualizado.');
    } catch (e) {
      setMsg('❌ No se pudo actualizar el perfil.');
    } finally {
      setBusy(false);
    }
  };

  async function compressImage(file, maxSize = 384, quality = 0.7) {
    const img = await new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });

    const canvas = document.createElement('canvas');
    const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // JPEG para recortar peso
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    return dataUrl;
  }

  const changePassword = async () => {
    setBusy(true);
    setMsg("");
    try {
      const oldp = passOldRef.current.value;
      const p1 = passNewRef.current.value;
      const p2 = passNew2Ref.current.value;
      if (!oldp || !p1) throw new Error("Completa las contraseñas.");
      if (p1 !== p2) throw new Error("Las contraseñas nuevas no coinciden.");

      // Firma correcta: (token, currentPassword, newPassword)
      await apix.changePassword(token, oldp, p1);

      setMsg("🔒 Contraseña actualizada.");
      passOldRef.current.value = "";
      passNewRef.current.value = "";
      passNew2Ref.current.value = "";
    } catch (e) {
      setMsg("❌ No se pudo cambiar la contraseña.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="pmodal__backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="pmodal" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado */}
        <div className="pmodal__header">
          <div className="pmodal__brandPh">SR</div>
          <h3 className="pmodal__title">Mi Perfil</h3>
          <button className="pmodal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {/* Contenido */}
        <div className="pmodal__body">
          {/* Avatar (solo UI) */}
          <div className="pmodal__avatarBox">
            <div className="pmodal__avatar">
              {avatar ? <img src={avatar} alt="Avatar" /> : <div className="pmodal__avatarPh">👤</div>}
            </div>
            <label className="btn btn-outline-secondary btn-sm">
              Cambiar foto
              <input type="file" accept="image/*" hidden onChange={onPickAvatar} />
            </label>
          </div>

          {/* Datos */}
          <div className="pmodal__grid">
            <div className="form__grp">
              <label>Nombre de usuario</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Tu nombre"
              />
            </div>

            <div className="form__grp">
              <label>Correo electrónico</label>
              <input value={email || user?.email || ""} disabled />
            </div>

            <div className="form__grp">
              <label>Número de teléfono</label>
              <input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="+51 ..."
              />
            </div>

            <div className="form__grp">
              <label>Dirección</label>
              <input
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                placeholder="Cajamarca, Perú"
              />
            </div>

            <div className="form__grp">
              <label>Fecha de nacimiento</label>
              <input
                type="date"
                value={form.fecha_nacimiento}
                onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
              />
            </div>

            <div className="form__grp">
              <label>Género</label>
              <select
                value={form.genero}
                onChange={(e) => setForm({ ...form, genero: e.target.value })}
              >
                <option value="na">Prefiero no decirlo</option>
                <option value="female">Femenino</option>
                <option value="male">Masculino</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary pmodal__save" onClick={saveProfile} disabled={busy}>
            {busy ? "Guardando..." : "Guardar cambios"}
          </button>

          {/* Cambiar contraseña */}
          <div className="pmodal__divider" />
          <h4 className="pmodal__subtitle">Cambiar contraseña</h4>
          <div className="pmodal__grid3">
            <div className="form__grp">
              <label>Contraseña actual</label>
              <input type="password" ref={passOldRef} />
            </div>
            <div className="form__grp">
              <label>Nueva contraseña</label>
              <input type="password" ref={passNewRef} />
            </div>
            <div className="form__grp">
              <label>Confirmar nueva</label>
              <input type="password" ref={passNew2Ref} />
            </div>
          </div>
          <button className="btn btn-accent" onClick={changePassword} disabled={busy}>
            Actualizar contraseña
          </button>

          {msg && <div className="pmodal__msg">{msg}</div>}
        </div>
      </div>
    </div>
  );
}
