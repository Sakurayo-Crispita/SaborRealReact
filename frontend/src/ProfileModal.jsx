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
  const { token, user, email } = useAuth(); // user puede venir de localStorage
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
      setAvatar("");
      setMsg("");
    }
  }, [open, user]);

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg("El archivo debe ser una imagen.");
      return;
    }
    const dataUrl = await fileToDataURL(file);
    setAvatar(dataUrl); // solo vista previa (no se envía al backend)
  };

// Dentro de ProfileModal.jsx
  const saveProfile = async () => {
    setBusy(true);
    setMsg("");
    try {
      // 1) Construir payload SOLO con campos soportados por el backend
      const payload = {
        // usa español si existe; si no, mapea desde tus claves en inglés
        nombre: form.nombre ?? form.name ?? undefined,
        telefono: form.telefono ?? form.phone ?? undefined,
        direccion: form.direccion ?? form.address ?? undefined,
        genero: form.genero ?? form.gender ?? undefined,
        fecha_nacimiento: form.fecha_nacimiento ?? form.birthdate ?? undefined,
        avatarUrl: avatar || null, // <-- IMPORTANTE: envía el avatar (data URL) si lo cambiaste
      };

      // 2) Guardar en backend (PUT /api/auth/me) y recibir perfil consistente
      const updated = await apix.updateProfile(token, payload); // debe devolver el perfil

      // 3) Refrescar estado global y storage para que el header cambie
      //    (useAuth debe exponer setUser)
      setUser?.(prev => ({ ...prev, ...updated }));
      localStorage.setItem("sr_user", JSON.stringify({ ...(JSON.parse(localStorage.getItem("sr_user")||"{}")), ...updated }));

      setMsg("✅ Perfil actualizado."); 
    } catch (e) {
      setMsg("❌ No se pudo actualizar el perfil.");
    } finally {
      setBusy(false);
    }
  };


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
