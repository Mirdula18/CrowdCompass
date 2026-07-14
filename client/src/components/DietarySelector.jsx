import React from "react";

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "nut-free", label: "Nut-Free" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
];

export default function DietarySelector({ selected, onChange }) {
  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((d) => d !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div>
      <label className="field-label">Dietary Restrictions</label>
      <div className="chip-group">
        {DIETARY_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`chip ${selected.includes(opt.id) ? "selected" : ""}`}
            onClick={() => toggle(opt.id)}
          >
            {opt.label}
            {selected.includes(opt.id) && <span className="chip-x">×</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
