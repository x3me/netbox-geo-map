function MultiselectDropdown(options) {
  let config = {
    search: true,
    placeholder: "select",
    txtSelected: "selected",
    txtAll: "All",
    txtRemove: "Remove",
    txtSearch: "Search ",
    ...options,
  };
  function newEl(tag, attrs) {
    let e = document.createElement(tag);
    if (attrs !== undefined)
      Object.keys(attrs).forEach((k) => {
        if (k === "class") {
          Array.isArray(attrs[k])
            ? attrs[k].forEach((o) => (o !== "" ? e.classList.add(o) : 0))
            : attrs[k] !== ""
            ? (e.class = attrs[k]
                .split(" ")
                .map((o) => (o !== "" ? e.classList.add(o) : 0)))
            : 0;
        } else if (k === "style") {
          Object.keys(attrs[k]).forEach((ks) => {
            e.style[ks] = attrs[k][ks];
          });
        } else if (k === "text") {
          attrs[k] === "" ? (e.innerHTML = "&nbsp;") : (e.innerText = attrs[k]);
        } else e[k] = attrs[k];
      });
    return e;
  }
  document.querySelectorAll("select[multiple]").forEach((el, k) => {
    let div = newEl("div", {
      class: ["multiselect-dropdown", "btn"],
      style: {
        width: config.style?.width ?? el.clientWidth + "px",
        padding: config.style?.padding ?? "",
      },
    });
    el.style.display = "block";
    el.parentNode.insertBefore(div, el.nextSibling);
    let listWrap = newEl("div", {
      class: ["multiselect-dropdown-list-wrapper", "bg-surface-secondary"],
    });
    let list = newEl("div", {
      class: [
        "multiselect-dropdown-list",
        "ts-control",
        "bg-surface-secondary",
      ],
      style: { height: config.height },
    });
    let search = newEl("input", {
      class: ["multiselect-dropdown-search"].concat([
        config.searchInput?.class ?? "form-control",
      ]),
      style: {
        width: "100%",
        display:
          el.attributes["multiselect-search"]?.value === "true"
            ? "block"
            : "none",
      },
      placeholder: config.txtSearch,
    });
    listWrap.appendChild(search);
    div.appendChild(listWrap);
    listWrap.appendChild(list);

    el.loadOptions = () => {
      list.innerHTML = "";

      if (el.attributes["multiselect-select-all"]?.value == "true") {
        let op = newEl("div", { class: "multiselect-dropdown-all-selector" });
        let ic = newEl("input", {
          type: "checkbox",
        });
        op.appendChild(ic);
        op.appendChild(newEl("label", { text: config.txtAll }));
        op.addEventListener("click", () => {
          op.classList.toggle("checked");
          op.querySelector("input").checked =
            !op.querySelector("input").checked;
          let ch = op.querySelector("input").checked;
          list
            .querySelectorAll(
              ":scope > div:not(.multiselect-dropdown-all-selector)"
            )
            .forEach((i) => {
              if (i.style.display !== "none") {
                i.querySelector("input").checked = ch;
                i.optEl.selected = ch;
              }
            });

          el.dispatchEvent(new Event("change"));
        });
        ic.addEventListener("click", (ev) => {
          ic.checked = !ic.checked;
        });
        el.addEventListener("change", (ev) => {
          let itms = Array.from(
            list.querySelectorAll(
              ":scope > div:not(.multiselect-dropdown-all-selector)"
            )
          ).filter((e) => e.style.display !== "none");
          let existsNotSelected = itms.find(
            (i) => !i.querySelector("input").checked
          );
          if (ic.checked && existsNotSelected) ic.checked = false;
          else if (ic.checked == false && existsNotSelected === undefined)
            ic.checked = true;
        });

        list.appendChild(op);
      }

      Array.from(el.options).map((o) => {
        let op = newEl("div", {
          class: o.selected ? ["checked"] : "",
          optEl: o,
        });
        let ic = newEl("input", {
          type: "checkbox",
          checked: o.selected,
        });
        op.appendChild(ic);
        if (el.id === "provider-select") {
          const { color } = o.dataset;
          let colorSquare = newEl("div", {
            class: "color-square",
            style: {
              display: "block",
              background: color !== "None" ? color : "white",
              border: "1px solid #767676",
              width: "13px",
              height: "13px",
              borderRadius: "2px",
              marginRight: "5px",
            },
          });
          op.appendChild(colorSquare);
        }

        op.appendChild(newEl("label", { text: o.text }));
        op.addEventListener("click", () => {
          op.classList.toggle("checked");
          op.querySelector("input").checked =
            !op.querySelector("input").checked;
          op.optEl.selected = !!!op.optEl.selected;
          el.dispatchEvent(new Event("change"));
        });
        ic.addEventListener("click", (ev) => {
          ic.checked = !ic.checked;
        });
        o.listitemEl = op;
        list.appendChild(op);
      });
      div.listEl = listWrap;

      div.refresh = () => {
        div
          .querySelectorAll(
            "span.optext, span.dropdown-placeholder, .clear-selection"
          )
          .forEach((t) => div.removeChild(t));
        let sels = Array.from(el.selectedOptions);

        if (sels.length > 0) {
          div.appendChild(
            newEl("span", {
              class: ["optext", "maxselected"],
              style: {
                backgroundColor: "rgba(84, 96, 116, 0.2)",
              },
              text: el.attributes["placeholder"]?.value,
            })
          );

          if (
            div.listEl.style.display === "none" ||
            div.listEl.style.display === ""
          ) {
            let clearBtn = newEl("span", {
              class: ["clear-selection"],
              style: {
                position: "absolute",
                top: "-6px",
                right: "-6px",
                backgroundColor: "rgba(24, 36, 51, 1)",
                border: "1px solid rgba(84, 96, 116)",
                borderRadius: "50%",
                width: "12px",
                height: "12px",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "8px",
              },
              text: "x",
              onclick: (ev) => {
                Array.from(el.options).forEach((option) => {
                  option.selected = false;
                });

                list
                  .querySelectorAll("input[type='checkbox']")
                  .forEach((checkbox) => {
                    checkbox.checked = false;
                  });

                el.dispatchEvent(new Event("change"));
                div.refresh();

                ev.stopPropagation();
              },
            });

            div.appendChild(clearBtn);
          }
        } else {
          div.appendChild(
            newEl("span", {
              class: ["dropdown-placeholder"],
              style: { display: el.selectedOptions.length ? "none" : "flex" },
              text: el.attributes["placeholder"]?.value ?? config.placeholder,
            })
          );
        }
      };

      div.refresh();
    };
    el.loadOptions();

    search.addEventListener("input", () => {
      list
        .querySelectorAll(":scope div:not(.multiselect-dropdown-all-selector)")
        .forEach((d) => {
          let label = d.querySelector("label");
          if (!label) return;
          let text = label.textContent.toUpperCase();
          d.style.display =
            search.value && !text.includes(search.value.toUpperCase())
              ? "none"
              : "flex";
        });
    });
    div.addEventListener("click", () => {
      div.listEl.style.display = "block";
      search.focus();
      search.select();

      div.querySelectorAll(".clear-selection").forEach((btn) => {
        btn.style.display = "none";
      });
    });

    document.addEventListener("click", function (event) {
      if (!div.contains(event.target)) {
        listWrap.style.display = "none";

        div.refresh();
      }
    });
  });
}

window.addEventListener("load", () => {
  MultiselectDropdown(window.MultiselectDropdownOptions);
});
