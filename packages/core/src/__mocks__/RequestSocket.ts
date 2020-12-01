export const mockRequestSocket = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  request: jest.fn((arg) => ({ ...arg, res: 0 })),
  close: jest.fn(),
}

export const createRequestSocket = () => mockRequestSocket
