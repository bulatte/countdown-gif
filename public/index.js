const button = document.querySelector("button");
button.addEventListener("click", () => {
  const input = document.querySelector("input");
  const value = input.value;
  if (!value) return;

  const iframe = document.querySelector("iframe");
  const newSrc = `/countdown?time=${value}`;
  iframe.src = newSrc;
});
