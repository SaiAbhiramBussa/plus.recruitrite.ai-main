import React from "react";

interface AlertProps {
  type: "error" | "success" | "warning";
  msg: string;
};

const Alert = ({type,msg}:AlertProps) => {
  return (
    <div
      data-error
      className="flex items-center gap-3 bg-red-100 p-4 mb-4 text-sm rounded-lg dark:text-red-800"
      role="alert"
    >
      <div>
        {type == "success" ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 22 22"
          >
            <g id="check" transform="translate(-721 -441)">
              <g
                id="Elipse_422"
                data-name="Elipse 422"
                transform="translate(721 441)"
                fill="none"
                stroke="#2e7d32"
                strokeWidth="1"
              >
                <circle cx="11" cy="11" r="11" stroke="none" />
                <circle cx="11" cy="11" r="10.5" fill="none" />
              </g>
              <g
                id="Layer_2"
                data-name="Layer 2"
                transform="translate(725 445)"
              >
                <g id="checkmark">
                  <rect
                    id="Rectángulo_2010"
                    data-name="Rectángulo 2010"
                    width="14"
                    height="14"
                    fill="#2e7d32"
                    opacity="0"
                  />
                  <path
                    id="Trazado_3573"
                    data-name="Trazado 3573"
                    d="M7.418,12.982a.583.583,0,0,1-.426-.187L4.157,9.779a.584.584,0,1,1,.852-.8l2.4,2.561,4.906-5.367a.583.583,0,1,1,.863.782L7.85,12.789a.583.583,0,0,1-.426.193Z"
                    transform="translate(-1.666 -2.482)"
                    fill="#2e7d32"
                  />
                </g>
              </g>
            </g>
          </svg>
        ) : (
          <svg
            id="alert"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <g id="alert-triangle">
              <rect
                id="Rectángulo_2121"
                data-name="Rectángulo 2121"
                width="24"
                height="24"
                transform="translate(24) rotate(90)"
                fill="#da1212"
                opacity="0"
              />
              <path
                id="Trazado_3686"
                data-name="Trazado 3686"
                d="M22.56,16.3,14.89,3.58a3.43,3.43,0,0,0-5.78,0L1.44,16.3a3,3,0,0,0-.05,3A3.37,3.37,0,0,0,4.33,21H19.67a3.37,3.37,0,0,0,2.94-1.66,3,3,0,0,0-.05-3.04Zm-1.7,2.05a1.31,1.31,0,0,1-1.19.65H4.33a1.31,1.31,0,0,1-1.19-.65,1,1,0,0,1,0-1L10.82,4.62a1.48,1.48,0,0,1,2.36,0l7.67,12.72a1,1,0,0,1,.01,1.01Z"
                fill="#da1212"
              />
              <circle
                id="Elipse_448"
                data-name="Elipse 448"
                cx="1"
                cy="1"
                r="1"
                transform="translate(11 15)"
                fill="#da1212"
              />
              <path
                id="Trazado_3687"
                data-name="Trazado 3687"
                d="M12,8a1,1,0,0,0-1,1v4a1,1,0,0,0,2,0V9A1,1,0,0,0,12,8Z"
                fill="#da1212"
              />
            </g>
          </svg>
        )}
      </div>
      <p>{msg}</p>
    </div>
  );
};

export default Alert;
