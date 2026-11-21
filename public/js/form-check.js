function clearFormErrors(form) {
  form.querySelectorAll(".field-error").forEach((note) => note.remove());
  form.querySelectorAll("[aria-invalid], [aria-describedby]").forEach((control) => {
    control.removeAttribute("aria-invalid");
    control.removeAttribute("aria-describedby");
  });
}

function findFormErrors(form) {
  const errors = [];
  const names = [...new Set([...form.elements].filter((el) => el.name).map((el) => el.name))];

  for (const name of names) {
    const controls = [...form.elements].filter((el) => el.name === name);
    const first = controls[0];
    const label = first.dataset.label || name;
    const unit = first.dataset.unit || "";
    let message = "";

    if (first.required) {
      const filled = first.type === "radio"
        ? controls.some((control) => control.checked)
        : first.value.trim() !== "";
      if (!filled) message = "필수 입력입니다";
    }

    const min = first.dataset.min ?? first.getAttribute("min");
    const max = first.dataset.max ?? first.getAttribute("max");
    if (!message && (min !== null || max !== null) && first.value.trim() !== "") {
      const number = Number(first.value);
      if (!Number.isFinite(number)) {
        message = `${label}은(는) 숫자로 입력하세요`;
      } else if (min !== null && number < Number(min)) {
        message = `${label}은(는) ${min}${unit} 이상의 숫자로 입력하세요`;
      } else if (max !== null && number > Number(max)) {
        message = `${label}은(는) ${max}${unit} 이하의 숫자로 입력하세요`;
      }
    }

    if (message) errors.push({ name, controls, message });
  }

  return errors;
}

function checkForm(form) {
  clearFormErrors(form);
  const errors = findFormErrors(form);

  for (const { name, controls, message } of errors) {
    const note = document.createElement("p");
    note.className = "field-error";
    note.id = `error-${name}`;
    note.textContent = message;

    const container = controls[0].closest("fieldset") || controls[0].closest(".field") || controls[0].parentElement;
    container.append(note);

    for (const control of controls) {
      control.setAttribute("aria-invalid", "true");
      control.setAttribute("aria-describedby", note.id);
    }
  }

  if (errors.length > 0) errors[0].controls[0].focus();
  return errors.length === 0;
}
