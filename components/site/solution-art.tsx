import { ProductArt } from "./product-art";
import type { ProductConcept } from "@/lib/public-content";

export function SolutionArt({
  shape,
}: {
  shape: ProductConcept["illustration"];
}) {
  if (shape === "halo" || shape === "linear")
    return <ProductArt shape={shape} />;
  return (
    <div className={`solution-art shape-${shape}`} aria-hidden="true">
      <svg viewBox="0 0 400 300" fill="none">
        <g stroke="#b9ae92" strokeWidth="1.5" fill="#282b27">
          {shape === "lock" && (
            <>
              <rect x="165" y="35" width="70" height="235" rx="13" />
              <rect
                x="176"
                y="49"
                width="48"
                height="72"
                rx="5"
                fill="#131715"
              />
              <circle cx="200" cy="83" r="10" />
              <path d="M187 157h89v16h-89z" />
              <circle cx="200" cy="227" r="6" />
            </>
          )}
          {shape === "switch" && (
            <>
              <rect x="105" y="58" width="190" height="184" rx="9" />
              <rect x="118" y="71" width="164" height="158" rx="5" />
              <path d="M172 72v156m55-156v156" />
              <path
                d="M138 199h14m38 0h15m39 0h15"
                stroke="#dbc38e"
                strokeWidth="3"
              />
            </>
          )}
          {shape === "camera" && (
            <>
              <path d="M136 186v42h90v-17h-70v-25z" />
              <path d="M119 98h140l28 36-19 53H133l-24-30z" />
              <ellipse cx="267" cy="151" rx="30" ry="39" />
              <ellipse cx="267" cy="151" rx="16" ry="24" fill="#0a0e0d" />
              <circle cx="267" cy="149" r="7" fill="#756e58" />
            </>
          )}
          {shape === "sensor" && (
            <>
              <circle cx="200" cy="150" r="76" />
              <circle cx="200" cy="150" r="59" />
              <circle
                cx="200"
                cy="150"
                r="35"
                fill="#ddd8c9"
                stroke="#e5ddc9"
              />
              <circle cx="200" cy="207" r="2" fill="#d7bc86" />
            </>
          )}
          {shape === "speaker" && (
            <>
              <rect x="136" y="47" width="128" height="210" rx="42" />
              <path
                d="M147 88h106m-112 13h118m-121 13h124m-125 13h126m-126 13h126m-126 13h126m-126 13h126m-125 13h124m-123 13h122m-120 13h118m-115 13h112"
                opacity=".35"
              />
              <ellipse cx="200" cy="68" rx="45" ry="12" />
              <path d="M195 68h10m-5-5v10" />
            </>
          )}
          {shape === "outdoor" && (
            <>
              <path d="M172 113h56v141h-56z" />
              <path d="M156 91h88v30h-88z" />
              <path d="M163 121h74v14h-74z" fill="#e8cc93" />
              <ellipse cx="200" cy="255" rx="61" ry="5" opacity=".35" />
            </>
          )}
          {shape === "network" && (
            <>
              <rect x="106" y="152" width="188" height="65" rx="9" />
              <path d="M122 152V74m156 78V74" strokeWidth="7" />
              <path
                d="M122 191h9m14 0h9m14 0h9"
                stroke="#dec99f"
                strokeWidth="4"
              />
              <path d="M223 183h51v17h-51z" />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}
