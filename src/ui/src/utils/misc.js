const colorToRGBA = (cssColor, alpha = 1) => {
  if (typeof window === "undefined" || !cssColor)
    return `rgba(0, 0, 0, ${alpha})`;

  let el = document.createElement("div");
  el.style.color = cssColor;
  el.style.display = "none";
  document.body.appendChild(el);
  let rgba = window.getComputedStyle(el).getPropertyValue("color");
  el.remove();
  let [r, g, b, a] = rgba.match(/[0-9.]+/g).map((n) => Number(n));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const genrateRandomAccents = (length, color) => {
  let accents = [];

  for (let i = 0; i < length; i++) {
    accents.push(colorToRGBA(color, (80 - i * 7) / 100));
  }

  return accents;
};

const isUUID = (uuid) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    uuid
  );
};

module.exports = { colorToRGBA, genrateRandomAccents, isUUID };
