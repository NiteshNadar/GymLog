import { z } from 'zod';

export const deleteUserSchema = z.object({
  confirmationText: z.literal('DELETE MY ACCOUNT', {
    message: 'Confirmation text must be exactly "DELETE MY ACCOUNT"'
  }),
});
