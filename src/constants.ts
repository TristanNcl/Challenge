export const jwtConstants = {
  secret: process.env.JWT_ACCESS_TOKEN_SECRET,
  expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
};

export const PASSWORD_MIN_LENGTH = 8;
export const SALT_ROUNDS = 10;
