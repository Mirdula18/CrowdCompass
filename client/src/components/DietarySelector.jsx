import { memo } from "react";

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "nut-free", label: "Nut-Free" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
];

function DietarySelector({ selected, onChange }) {
  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((d) => d !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div>
      <label className="field-label" id="dietary-label">Dietary Restrictions</label>
      <div className="chip-group" role="group" aria-labelledby="dietary-label">
        {DIETARY_OPTIONS.map((opt) => {
          const isSelected = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              className={`chip ${isSelected ? "selected" : ""}`}
              aria-pressed={isSelected}
              onClick={() => toggle(opt.id)}
            >
              {opt.label}
              {isSelected && <span className="chip-x" aria-hidden="true">×</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(DietarySelector);
