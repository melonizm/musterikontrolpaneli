"use client";

import { useState } from "react";

const PRESET_PERSONALITIES = [
  "şüpheci",
  "istekli",
  "isteksiz",
  "yorgun",
  "kararsız",
  "sinirli",
  "meraklı",
  "sabırsız",
  "nazik",
  "soğuk",
  "güvenilir",
  "agresif",
  "sakin",
  "tedirgin",
];

interface PersonalityTagsProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

const tagColorMap: Record<string, string> = {
  "şüpheci": "tag-orange",
  "istekli": "tag-green",
  "isteksiz": "tag-red",
  "yorgun": "tag-purple",
  "kararsız": "tag-yellow",
  "sinirli": "tag-red",
  "meraklı": "tag-blue",
  "sabırsız": "tag-orange",
  "nazik": "tag-green",
  "soğuk": "tag-gray",
  "güvenilir": "tag-green",
  "agresif": "tag-red",
  "sakin": "tag-blue",
  "tedirgin": "tag-yellow",
};

export default function PersonalityTags({ selected, onChange }: PersonalityTagsProps) {
  const [customTag, setCustomTag] = useState("");

  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  const addCustomTag = () => {
    const tag = customTag.trim().toLowerCase();
    if (tag && !selected.includes(tag)) {
      onChange([...selected, tag]);
      setCustomTag("");
    }
  };

  return (
    <div className="personality-section">
      <label className="form-label">Kişilik Özellikleri</label>
      <div className="preset-tags">
        {PRESET_PERSONALITIES.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`preset-tag ${selected.includes(tag) ? `preset-tag-selected ${tagColorMap[tag] || "tag-gray"}` : ""}`}
          >
            {tag}
            {selected.includes(tag) && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        ))}
      </div>
      <div className="custom-tag-input">
        <input
          type="text"
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomTag();
            }
          }}
          placeholder="Özel özellik ekle..."
          className="form-input custom-tag-field"
        />
        <button
          type="button"
          onClick={addCustomTag}
          className="btn btn-sm btn-secondary"
        >
          Ekle
        </button>
      </div>
    </div>
  );
}
