import { useRef } from "react";
import { X } from "lucide-react";

// Options of a List field as chips: typing a comma (or Enter) turns what's been typed into a chip,
// each chip has an X to remove it, and Backspace on an empty input removes the last one. Pasting
// "Campo, Platea, VIP" makes three chips at once. Controlled: `options` is the chip list, `draft`
// the text still being typed (it counts as an option until it's turned into a chip — see
// listOptions in PrivateAttributesStepFields.jsx).
export default function OptionChipsInput({ options, draft, onChange, ariaLabel, placeholder }) {
  const inputRef = useRef(null);

  // Everything before the last comma becomes chips; what's after it stays as the draft. A value
  // that's already a chip isn't added twice (it stays in the draft, where the row shows the error).
  const commit = (text) => {
    const parts = text.split(",");
    const rest = parts.pop().replace(/^\s+/, "");
    const next = [...options];
    const repeated = [];
    parts
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => (next.includes(part) ? repeated.push(part) : next.push(part)));
    onChange(next, [...repeated, rest].filter(Boolean).join(", "));
  };

  const handleChange = (event) => {
    const text = event.target.value;
    if (text.includes(",")) commit(text);
    else onChange(options, text);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (draft.trim()) commit(`${draft},`);
    } else if (event.key === "Backspace" && !draft && options.length) {
      event.preventDefault();
      onChange(options.slice(0, -1), "");
    }
  };

  const remove = (index) => {
    onChange(options.filter((_, i) => i !== index), draft);
    inputRef.current?.focus();
  };

  return (
    <div className="form-control option-chips" onClick={() => inputRef.current?.focus()}>
      {options.map((option, index) => (
        <span className="option-chip" key={`${option}-${index}`}>
          <span className="option-chip-label">{option}</span>
          <button
            type="button"
            className="option-chip-remove"
            onClick={(event) => {
              event.stopPropagation();
              remove(index);
            }}
            aria-label={`Remove option ${option}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        className="option-chips-input"
        aria-label={ariaLabel}
        placeholder={options.length ? "" : placeholder}
        value={draft}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (draft.trim()) commit(`${draft},`);
        }}
      />
    </div>
  );
}
