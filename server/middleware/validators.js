import { celebrate, Joi, Segments } from 'celebrate';

export const validateLogin = celebrate({
  [Segments.BODY]: Joi.object({ id: Joi.string().required(), password: Joi.string().required() })
});

export const validateReservation = celebrate({
  [Segments.BODY]: Joi.object({
    resourceId: Joi.string().hex().length(24).required(),
    requestedDate: Joi.date().optional()
  })
});

export const validatePasswordChange = celebrate({
  [Segments.BODY]: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required().messages({ 'string.min': 'Password must be at least 8 characters' })
  })
});
