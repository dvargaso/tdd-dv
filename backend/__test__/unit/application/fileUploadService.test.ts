/**
 * fileUploadService — unit tests (UF-01..UF-07 per fileUploadService_unit_test_plan.md).
 * Given: mocks + inputs. When: one call. Then: status/json or return value only.
 */

import type { Request, Response } from 'express';

/** Per-test Multer middleware behavior (req, res, cb) => void */
let runUploader: (req: MockReq, res: Response, cb: (err?: unknown) => void) => void;

jest.mock('multer', () => {
    const actual = jest.requireActual<typeof import('multer')>('multer');
    const multerFn = Object.assign(
        jest.fn(() => ({
            single: jest.fn((fieldName: string) => {
                expect(fieldName).toBe('file');
                return (req: MockReq, res: Response, cb: (err?: unknown) => void) => {
                    runUploader(req, res, cb);
                };
            }),
        })),
        {
            MulterError: actual.MulterError,
            diskStorage: actual.diskStorage,
            memoryStorage: actual.memoryStorage,
        },
    );
    return { __esModule: true, default: multerFn };
});

import multer from 'multer';
import { uploadFile, sum } from '../../../src/application/services/fileUploadService';

type MockReq = Partial<Request> & { file?: Express.Multer.File };

function mockRes(): { res: Response; json: jest.Mock; status: jest.Mock } {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    return { res: { status } as unknown as Response, json, status };
}

beforeEach(() => {
    jest.clearAllMocks();
    runUploader = () => {
        throw new Error('runUploader not configured for this test');
    };
});

describe('uploadFile', () => {
    it('UF-01 success returns path and MIME', () => {
        // Given
        const { res, json, status } = mockRes();
        const req: MockReq = {};
        runUploader = (r, _res, cb) => {
            r.file = {
                fieldname: 'file',
                originalname: 'x.pdf',
                encoding: '7bit',
                mimetype: 'application/pdf',
                size: 1,
                destination: '',
                filename: '',
                path: '/tmp/1-x.pdf',
                buffer: Buffer.alloc(0),
            } as Express.Multer.File;
            cb(undefined);
        };
        // When
        uploadFile(req as Request, res);
        // Then
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            filePath: '/tmp/1-x.pdf',
            fileType: 'application/pdf',
        });
    });

    it('UF-02 MulterError maps to 500 + message', () => {
        // Given
        const { res, json, status } = mockRes();
        const req: MockReq = {};
        runUploader = (_req, _res, cb) => {
            cb(new multer.MulterError('LIMIT_FILE_SIZE', undefined));
        };
        // When
        uploadFile(req as Request, res);
        // Then
        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({ error: 'File too large' });
    });

    it('UF-03 non-Multer error maps to 500 + message', () => {
        // Given
        const { res, json, status } = mockRes();
        const req: MockReq = {};
        runUploader = (_req, _res, cb) => {
            cb(new Error('disk full'));
        };
        // When
        uploadFile(req as Request, res);
        // Then
        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({ error: 'disk full' });
    });

    it('UF-04 no file after callback returns 400 with fixed message', () => {
        // Given
        const { res, json, status } = mockRes();
        const req: MockReq = {};
        runUploader = (_req, _res, cb) => {
            cb(undefined);
        };
        // When
        uploadFile(req as Request, res);
        // Then
        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({
            error: 'Invalid file type, only PDF and DOCX are allowed!',
        });
    });
});

describe('sum', () => {
    it('UF-05 adds two positive integers', () => {
        // Given
        // When / Then
        expect(sum(2, 3)).toBe(5);
    });

    it('UF-06 adds negative and positive', () => {
        // Given
        // When / Then
        expect(sum(-1, 4)).toBe(3);
    });

    it('UF-07 zero edge', () => {
        // Given
        // When / Then
        expect(sum(0, 0)).toBe(0);
    });
});
