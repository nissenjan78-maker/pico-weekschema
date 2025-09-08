import React from "react";

export function Avatar({ value, size = 24, className = "" }) {
  const src = typeof value === "string" && value.startsWith("/")
    ? value
    : `/avatars/${value || "Pico.png"}`;
  const px = `${size}px`;

  return (
    <img
      src={src}
      alt="avatar"
      width={size}
      height={size}
      className={["rounded-full object-cover border border-neutral-200", className].join(" ")}
      style={{ width: px, height: px }}
      draggable={false}
    />
  );
}
