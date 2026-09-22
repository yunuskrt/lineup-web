export type ColorPrimitive = {
  name: string;
  variable: string;
  className: string;
};

export type ColorRole = {
  role: string;
  primitive: string;
  className: string;
};

export type TypeStep = {
  className: string;
  rem: string;
  use?: string;
};

export type SpacingStep = {
  px: number;
  className: string;
};

export type RadiusStep = {
  className: string;
  value: string;
  use: string;
};
