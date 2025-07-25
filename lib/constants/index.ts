export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Prostore";
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "localhost";
export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Ecommerce platform";
export const LATEST_PRODUCTS_LIMIT =
  Number(process.env.LATEST_PRODUCTS_LIMIT) || 4;

export const signInDefaultValues = {
  email: "",
  password: "",
};

export const signUpDefaultValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export const shippingAddressDefaultValues = {
  fullName: "",
  streetAddress: "",
  city: "",
  postalCode: "",
  country: "",
};

export const PROTECTED_PATHS = [
  /\/shipping-address/,
  /\/payment-method/,
  /\/place-order/,
  /\/profile/,
  /\/user\/(.*)/,
  /\/order\/(.*)/,
  /\/admin/,
];

export const PAYMENT_METHODS = process.env.PAYMENT_METHODS
  ? process.env.PAYMENT_METHODS.split(", ")
  : ["PayPal", "Stripe", "CashOnDelivery"];
export const DEFAULT_PAYMENT_METHOD = process.env.DEFAULT_PAYMENT_METHOD
  ? process.env.DEFAULT_PAYMENT_METHOD
  : "CashOnDelivery";

export const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 2;

export const productDefaultValues = {
  name: "",
  slug: "",
  category: "",
  images: [],
  brand: "",
  description: "",
  price: "0",
  stock: 0,
  rating: "0",
  numReviews: "0",
  isFeatured: false,
  banner: null,
};

export const USER_ROLES = process.env.USER_ROLES
  ? process.env.USER_ROLES.split(", ")
  : ["admin", "user"];

export const reviewFormDefaultValues = {
  title: "",
  comment: "",
  rating: 0,
};

export const SENDER_EMAIL =
  process.env.SENDER_EMAIL || "onboarding@no-reply.dev";

export const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
