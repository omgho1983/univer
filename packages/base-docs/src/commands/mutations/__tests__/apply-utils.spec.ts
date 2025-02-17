/* eslint-disable no-magic-numbers */
import { BooleanNumber, IDocumentBody, ITextRun, Nullable, UpdateDocsAttributeType } from '@univerjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { deleteTextRuns, insertTextRuns } from '../functions/common';
import { coverTextRuns } from '../functions/update-apply';

interface IMockBody {
    textRuns: ITextRun[];
}

describe('example', () => {
    let body: Nullable<IMockBody> = null;
    let updateTextRuns: ITextRun[] = [];

    beforeEach(() => {
        body = {
            textRuns: [
                {
                    st: 0,
                    ed: 15,
                    ts: {
                        bl: BooleanNumber.FALSE,
                    },
                },
                {
                    st: 15,
                    ed: 20,
                    ts: {
                        bl: BooleanNumber.FALSE,
                        it: BooleanNumber.TRUE,
                    },
                },
                {
                    st: 30,
                    ed: 40,
                    ts: {
                        bl: BooleanNumber.FALSE,
                    },
                },
            ],
        };

        updateTextRuns = [
            {
                st: 0,
                ed: 10,
                ts: {
                    bl: BooleanNumber.TRUE,
                    fs: 28,
                },
            },
        ];
    });

    afterEach(() => {
        body = null;
        updateTextRuns = [];
    });

    describe('test cases in function deleteTextRuns', () => {
        it('the inserted textRun is between two testRuns', async () => {
            const removedTextRuns = deleteTextRuns(body as IDocumentBody, 10, 20);

            expect(removedTextRuns.length).toBe(0);
            expect(body?.textRuns[2].st).toBe(20);
            expect(body?.textRuns[2].ed).toBe(30);
        });

        it('the inserted textRun is bigger than one testRuns', async () => {
            const removeTextRuns = deleteTextRuns(body as IDocumentBody, 20, 5);

            expect(removeTextRuns.length).toBe(2);
            expect(body?.textRuns[0].ed).toBe(5);
            expect(body?.textRuns[1].st).toBe(10);
            expect(body?.textRuns[1].ed).toBe(20);
        });

        it('the inserted textRun is smaller than one testRuns', async () => {
            const removeTextRuns = deleteTextRuns(body as IDocumentBody, 2, 16);

            expect(removeTextRuns.length).toBe(1);
            expect(body?.textRuns[1].ed).toBe(18);
            expect(body?.textRuns[2].st).toBe(28);
            expect(body?.textRuns[2].ed).toBe(38);
        });

        it('the inserted textRun is across two testRuns', async () => {
            const removeTextRuns = deleteTextRuns(body as IDocumentBody, 13, 5);

            expect(removeTextRuns.length).toBe(2);
            expect(body?.textRuns[0].ed).toBe(5);
            expect(body?.textRuns[1].st).toBe(5);
            expect(body?.textRuns[1].ed).toBe(7);
            expect(body?.textRuns[2].st).toBe(17);
            expect(body?.textRuns[2].ed).toBe(27);
        });

        it('the inserted textRun is across two testRuns that scattered', async () => {
            const removeTextRuns = deleteTextRuns(body as IDocumentBody, 20, 18);

            expect(removeTextRuns.length).toBe(2);
            expect(body?.textRuns[1].ed).toBe(18);
            expect(body?.textRuns[2].st).toBe(18);
            expect(body?.textRuns[2].ed).toBe(20);
        });
    });

    describe('test cases in function coverTextRuns', () => {
        it('it should return the updateTextRuns when the removeTextRuns is empty', async () => {
            const needUpdateTextRuns = coverTextRuns(updateTextRuns, [], UpdateDocsAttributeType.COVER);
            expect(needUpdateTextRuns.length).toBe(1);
            expect(needUpdateTextRuns[0].st).toBe(0);
            expect(needUpdateTextRuns[0].ed).toBe(10);
            expect(needUpdateTextRuns[0].ts?.bl).toBe(BooleanNumber.TRUE);
        });

        it('it should be passed when the removeTextRuns are continuous', async () => {
            const removeTextRuns = [
                {
                    st: 0,
                    ed: 5,
                    ts: {
                        it: BooleanNumber.TRUE,
                        bl: BooleanNumber.FALSE,
                    },
                },
                {
                    st: 5,
                    ed: 10,
                    ts: {
                        it: BooleanNumber.FALSE,
                        bl: BooleanNumber.FALSE,
                    },
                },
            ];

            const needUpdateTextRuns = coverTextRuns(updateTextRuns, removeTextRuns, UpdateDocsAttributeType.COVER);

            expect(needUpdateTextRuns.length).toBe(2);
            expect(needUpdateTextRuns[0]?.ts?.bl).toBe(BooleanNumber.TRUE);
            expect(needUpdateTextRuns[1]?.ts?.bl).toBe(BooleanNumber.TRUE);
        });

        it('it should be passed when the removeTextRuns are scattered', async () => {
            const removeTextRuns = [
                {
                    st: 3,
                    ed: 5,
                    ts: {
                        it: BooleanNumber.TRUE,
                        bl: BooleanNumber.FALSE,
                    },
                },
                {
                    st: 7,
                    ed: 9,
                    ts: {
                        it: BooleanNumber.FALSE,
                        bl: BooleanNumber.FALSE,
                    },
                },
            ];

            const needUpdateTextRuns = coverTextRuns(updateTextRuns, removeTextRuns, UpdateDocsAttributeType.COVER);

            expect(needUpdateTextRuns.length).toBe(5);
            expect(needUpdateTextRuns[0]?.ts?.bl).toBe(BooleanNumber.TRUE);
            expect(needUpdateTextRuns[1]?.ts?.bl).toBe(BooleanNumber.TRUE);
            expect(needUpdateTextRuns[2]?.ts?.bl).toBe(BooleanNumber.TRUE);
            expect(needUpdateTextRuns[3]?.ts?.bl).toBe(BooleanNumber.TRUE);
            expect(needUpdateTextRuns[4]?.ts?.bl).toBe(BooleanNumber.TRUE);
        });

        it('it should be pass the test when the removeTextRuns and updateTextRuns are both scattered', async () => {
            const updateTextRuns = [
                {
                    st: 1,
                    ed: 3,
                    ts: {
                        fs: 28,
                        bl: BooleanNumber.TRUE,
                    },
                },
                {
                    st: 5,
                    ed: 10,
                    ts: {
                        fs: 23,
                        bl: BooleanNumber.FALSE,
                    },
                },
            ];

            const removeTextRuns = [
                {
                    st: 2,
                    ed: 4,
                    ts: {
                        it: BooleanNumber.TRUE,
                        bl: BooleanNumber.FALSE,
                    },
                },
                {
                    st: 6,
                    ed: 8,
                    ts: {
                        it: BooleanNumber.FALSE,
                        bl: BooleanNumber.TRUE,
                    },
                },
            ];

            const needUpdateTextRuns = coverTextRuns(updateTextRuns, removeTextRuns, UpdateDocsAttributeType.COVER);

            expect(needUpdateTextRuns.length).toBe(6);
            expect(needUpdateTextRuns[0]?.ts?.bl).toBe(BooleanNumber.TRUE);
            expect(needUpdateTextRuns[1]?.ts?.bl).toBe(BooleanNumber.TRUE);
            expect(needUpdateTextRuns[2]?.ts?.bl).toBe(BooleanNumber.FALSE);
            expect(needUpdateTextRuns[3]?.ts?.bl).toBe(BooleanNumber.FALSE);
            expect(needUpdateTextRuns[4]?.ts?.bl).toBe(BooleanNumber.FALSE);
            expect(needUpdateTextRuns[5]?.ts?.bl).toBe(BooleanNumber.FALSE);
        });

        it('it should be pass the test when the removeTextRuns and updateTextRuns are both scattered, and has no intersection', async () => {
            const updateTextRuns = [
                {
                    st: 1,
                    ed: 2,
                    ts: {
                        fs: 28,
                        bl: BooleanNumber.TRUE,
                    },
                },
                {
                    st: 5,
                    ed: 6,
                    ts: {
                        fs: 23,
                        bl: BooleanNumber.FALSE,
                    },
                },
            ];

            const removeTextRuns = [
                {
                    st: 3,
                    ed: 4,
                    ts: {
                        it: BooleanNumber.TRUE,
                        bl: BooleanNumber.FALSE,
                    },
                },
                {
                    st: 7,
                    ed: 8,
                    ts: {
                        it: BooleanNumber.FALSE,
                        bl: BooleanNumber.TRUE,
                    },
                },
            ];

            const needUpdateTextRuns = coverTextRuns(updateTextRuns, removeTextRuns, UpdateDocsAttributeType.COVER);

            expect(needUpdateTextRuns.length).toBe(4);
            expect(needUpdateTextRuns[0]?.ts?.bl).toBe(BooleanNumber.TRUE);
            expect(needUpdateTextRuns[1]?.ts?.bl).toBe(BooleanNumber.FALSE);
            expect(needUpdateTextRuns[2]?.ts?.bl).toBe(BooleanNumber.FALSE);
            expect(needUpdateTextRuns[3]?.ts?.bl).toBe(BooleanNumber.TRUE);
        });
    });

    describe('test cases in function insertTextRuns', () => {
        it('it should pass the case when the insertTextRuns is at the beginning of one testRun', async () => {
            insertTextRuns(
                body as IDocumentBody,
                {
                    textRuns: updateTextRuns,
                } as IDocumentBody,
                10,
                0
            );

            expect(body?.textRuns.length).toBe(4);
        });

        it('it should pass the case when the insertTextRuns is between original testRuns', async () => {
            insertTextRuns(
                body as IDocumentBody,
                {
                    textRuns: updateTextRuns,
                } as IDocumentBody,
                10,
                25
            );

            expect(body?.textRuns.length).toBe(4);
            expect(body?.textRuns[0].ts?.bl).toBe(BooleanNumber.FALSE);
            expect(body?.textRuns[1].ts?.bl).toBe(BooleanNumber.FALSE);
            expect(body?.textRuns[2].ts?.bl).toBe(BooleanNumber.TRUE);
            expect(body?.textRuns[3].ts?.bl).toBe(BooleanNumber.FALSE);
        });

        it('it should pass the case when the insertTextRuns is at the end of one testRun', async () => {
            insertTextRuns(
                body as IDocumentBody,
                {
                    textRuns: updateTextRuns,
                } as IDocumentBody,
                10,
                15
            );

            expect(body?.textRuns.length).toBe(4);
        });

        it('it should pass the case when the insertTextRuns is at the in the middle of one testRun', async () => {
            insertTextRuns(
                body as IDocumentBody,
                {
                    textRuns: updateTextRuns,
                } as IDocumentBody,
                10,
                10
            );

            expect(body?.textRuns.length).toBe(5);
        });

        it('it should pass the case when the insertTextRuns has the same style with the origin textRun, and should be merged', async () => {
            const updateTextRuns = [
                {
                    st: 0,
                    ed: 10,
                    ts: {
                        bl: BooleanNumber.FALSE,
                    },
                },
            ];
            insertTextRuns(
                body as IDocumentBody,
                {
                    textRuns: updateTextRuns,
                } as IDocumentBody,
                10,
                10
            );

            expect(body?.textRuns.length).toBe(3);
            expect(body?.textRuns[0].ts?.bl).toBe(BooleanNumber.FALSE);
            expect(body?.textRuns[1].ts?.bl).toBe(BooleanNumber.FALSE);
            expect(body?.textRuns[2].ts?.bl).toBe(BooleanNumber.FALSE);
        });

        it('it should pass the case when the insertTextRuns is empty', async () => {
            insertTextRuns(
                body as IDocumentBody,
                {
                    textRuns: [],
                } as unknown as IDocumentBody,
                10,
                10
            );

            expect(body?.textRuns.length).toBe(3);
            expect(body?.textRuns[0].ts?.bl).toBe(BooleanNumber.FALSE);
            expect(body?.textRuns[1].ts?.bl).toBe(BooleanNumber.FALSE);
            expect(body?.textRuns[2].ts?.bl).toBe(BooleanNumber.FALSE);
        });
    });
});
