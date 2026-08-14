import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventImageField from '../../jsx/components/EventImageField';
import { errorFunction } from '../../jsx/toasts/sweetAlerts';

jest.mock('../../jsx/toasts/sweetAlerts', () => ({
  errorFunction: jest.fn(),
}));

const emptyValues = { imageFile: null, croppedAreaPixels: null };

function makeFile(name, type, sizeBytes) {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

function makeDataTransfer(files) {
  return { files, items: files.map((file) => ({ kind: 'file', type: file.type, getAsFile: () => file })), types: ['Files'] };
}

describe('EventImageField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-preview');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('renders the (large) dropzone when no image is selected', () => {
    render(<EventImageField values={emptyValues} onChange={jest.fn()} />);
    expect(screen.getByText(/Drag an image here/i)).toBeInTheDocument();
  });

  it('replaces the dropzone with the crop tool + remove button once an image is selected', () => {
    const file = makeFile('photo.png', 'image/png', 1024);
    render(<EventImageField values={{ ...emptyValues, imageFile: file }} onChange={jest.fn()} />);

    expect(screen.queryByText(/Drag an image here/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove image/i })).toBeInTheDocument();
  });

  it('clears the image (and brings the dropzone back) when the remove button is clicked', async () => {
    const onChange = jest.fn();
    const file = makeFile('photo.png', 'image/png', 1024);
    render(<EventImageField values={{ ...emptyValues, imageFile: file }} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /remove image/i }));

    expect(onChange).toHaveBeenCalledWith({ ...emptyValues, imageFile: null, croppedAreaPixels: null });
  });

  it('accepts a valid image via the file input and hands the File back via onChange', async () => {
    const onChange = jest.fn();
    render(<EventImageField values={emptyValues} onChange={onChange} />);
    const file = makeFile('photo.png', 'image/png', 1024);

    await userEvent.upload(screen.getByLabelText(/Image/i), file);

    expect(onChange).toHaveBeenCalledWith({ ...emptyValues, imageFile: file, croppedAreaPixels: null });
    expect(errorFunction).not.toHaveBeenCalled();
  });

  it('accepts a valid image dropped onto the dropzone', () => {
    const onChange = jest.fn();
    render(<EventImageField values={emptyValues} onChange={onChange} />);
    const file = makeFile('photo.png', 'image/png', 1024);
    const dropzone = screen.getByText(/Drag an image here/i).closest('.event-image-dropzone');

    fireEvent.drop(dropzone, { dataTransfer: makeDataTransfer([file]) });

    expect(onChange).toHaveBeenCalledWith({ ...emptyValues, imageFile: file, croppedAreaPixels: null });
    expect(errorFunction).not.toHaveBeenCalled();
  });

  it('toggles the dragover state on dragenter and clears it on dragleave', () => {
    render(<EventImageField values={emptyValues} onChange={jest.fn()} />);
    const dropzone = screen.getByText(/Drag an image here/i).closest('.event-image-dropzone');

    fireEvent.dragEnter(dropzone, { dataTransfer: makeDataTransfer([]) });
    expect(dropzone).toHaveClass('is-dragover');

    fireEvent.dragLeave(dropzone);
    expect(dropzone).not.toHaveClass('is-dragover');
  });

  it('rejects a non-image file without calling onChange', async () => {
    const onChange = jest.fn();
    render(<EventImageField values={emptyValues} onChange={onChange} />);
    const file = makeFile('notes.txt', 'text/plain', 1024);

    await userEvent.upload(screen.getByLabelText(/Image/i), file);

    expect(onChange).not.toHaveBeenCalled();
    expect(errorFunction).toHaveBeenCalledWith('Invalid File', expect.any(String), '');
  });

  it('rejects an image over 8MB without calling onChange', async () => {
    const onChange = jest.fn();
    render(<EventImageField values={emptyValues} onChange={onChange} />);
    const file = makeFile('huge.png', 'image/png', 9 * 1024 * 1024);

    await userEvent.upload(screen.getByLabelText(/Image/i), file);

    expect(onChange).not.toHaveBeenCalled();
    expect(errorFunction).toHaveBeenCalledWith('Image Too Large', expect.any(String), '');
  });
});
