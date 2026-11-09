// drag-to-move for the overlay layout (hold Shift on Windows) and the optional background image

const tauriApi = () => window.__TAURI__ ?? null;

export function setupLayoutEditor(container, { offsetX = 0, offsetY = 0 } = {}) {
    let ox = Number(offsetX) || 0;
    let oy = Number(offsetY) || 0;

    const apply = () => {
        container.style.transform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`;
    };
    apply();

    const save = () => {
        tauriApi()?.core.invoke("save_overlay_offset", { x: ox, y: oy }).catch(() => { });
    };

    let drag = null;
    container.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        drag = { x: e.clientX, y: e.clientY, ox, oy };
        e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
        if (!drag) return;
        ox = drag.ox + (e.clientX - drag.x);
        oy = drag.oy + (e.clientY - drag.y);
        apply();
    });

    const endDrag = () => {
        if (!drag) return;
        drag = null;
        save();
    };
    window.addEventListener("mouseup", endDrag);

    tauriApi()?.event.listen("overlay-edit-mode", (e) => {
        document.body.classList.toggle("edit-mode", !!e.payload);
        if (!e.payload) endDrag();
    });
}

// places the image behind the mouse keys: a box around all of them, drawn under the keys
export function setupBackgroundImage(container, mouseElements, { imageData = "", imageOpacity = 60 } = {}) {
    if (!imageData || !mouseElements) return;
    // the mouse pad is a canvas that is not in the key map, so find it by id
    const elements = [...mouseElements.values()].flat();
    container.querySelectorAll("#mouse_pad").forEach(el => elements.push(el));
    if (!elements.length) return;

    const base = container.getBoundingClientRect();
    const pad = 6;
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const el of elements) {
        const r = el.getBoundingClientRect();
        left = Math.min(left, r.left - base.left);
        top = Math.min(top, r.top - base.top);
        right = Math.max(right, r.right - base.left);
        bottom = Math.max(bottom, r.bottom - base.top);
    }
    if (!isFinite(left)) return;

    const layer = document.createElement("div");
    layer.id = "overlay-image-layer";
    layer.style.left = `${left - pad}px`;
    layer.style.top = `${top - pad}px`;
    layer.style.width = `${right - left + pad * 2}px`;
    layer.style.height = `${bottom - top + pad * 2}px`;
    layer.style.backgroundImage = `url("${imageData}")`;
    layer.style.opacity = String(Math.min(100, Math.max(0, Number(imageOpacity) || 0)) / 100);
    container.prepend(layer);
}
