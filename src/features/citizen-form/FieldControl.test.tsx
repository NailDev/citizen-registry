import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { FieldSchema } from '@/domain/schema';
import { FieldControl } from './FieldControl';

const email: FieldSchema = { name: 'email', label: 'E-mail', kind: 'email', required: true };
const skills: FieldSchema = {
  name: 'skills',
  label: 'Навыки',
  kind: 'multiselect',
  options: [
    { value: 'a', label: 'Первый' },
    { value: 'b', label: 'Второй' },
  ],
};

describe('FieldControl', () => {
  it('связывает сообщение об ошибке с полем', () => {
    render(<FieldControl field={email} value="" error="Введите e-mail" idPrefix="t" onChange={vi.fn()} onBlur={vi.fn()} />);
    const input = screen.getByLabelText(/E-mail/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Введите e-mail');
  });

  it('передаёт введённое значение наверх', async () => {
    const onChange = vi.fn();
    render(<FieldControl field={email} value="" idPrefix="t" onChange={onChange} onBlur={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/E-mail/), 'a');
    expect(onChange).toHaveBeenCalledWith('email', 'a');
  });

  it('добавляет и убирает значения в списке с множественным выбором', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<FieldControl field={skills} value={['a']} idPrefix="t" onChange={onChange} onBlur={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Второй'));
    expect(onChange).toHaveBeenLastCalledWith('skills', ['a', 'b']);
    rerender(<FieldControl field={skills} value={['a', 'b']} idPrefix="t" onChange={onChange} onBlur={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Первый'));
    expect(onChange).toHaveBeenLastCalledWith('skills', ['b']);
  });
});
