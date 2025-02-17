import {
    DocumentModel,
    getDocsUpdateBody,
    ICustomBlock,
    ICustomRange,
    IDocumentBody,
    IParagraph,
    ISectionBreak,
    ITable,
    ITextRun,
    Nullable,
    Tools,
    UpdateDocsAttributeType,
} from '@univerjs/core';

import {
    deleteCustomBlocks,
    deleteCustomRanges,
    deleteParagraphs,
    deleteSectionBreaks,
    deleteTables,
    deleteTextRuns,
    insertCustomBlocks,
    insertParagraphs,
    insertTables,
    insertTextRuns,
    normalizeTextRuns,
} from './common';

export function UpdateAttributeApply(
    document: DocumentModel,
    updateBody: Nullable<IDocumentBody>,
    textLength: number,
    currentIndex: number,
    coverType = UpdateDocsAttributeType.COVER,
    segmentId?: string
): IDocumentBody {
    if (updateBody == null) {
        throw new Error('updateBody is none');
    }

    const doc = document.snapshot;

    const body = getDocsUpdateBody(doc, segmentId);

    if (body == null) {
        throw new Error('no body has changed');
    }

    return updateAttribute(body, updateBody, textLength, currentIndex, coverType);
}

function updateAttribute(
    body: IDocumentBody,
    updateBody: IDocumentBody,
    textLength: number,
    currentIndex: number,
    coverType: UpdateDocsAttributeType
): IDocumentBody {
    const removeTextRuns = updateTextRuns(body, updateBody, textLength, currentIndex, coverType);

    const removeParagraphs = updateParagraphs(body, updateBody, textLength, currentIndex, coverType);

    const removeSectionBreaks = updateSectionBreaks(body, updateBody, textLength, currentIndex, coverType);

    const removeCustomBlocks = updateCustomBlocks(body, updateBody, textLength, currentIndex, coverType);

    const removeTables = updateTables(body, updateBody, textLength, currentIndex, coverType);

    const removeCustomRanges = updateCustomRanges(body, updateBody, textLength, currentIndex, coverType);

    return {
        dataStream: '',
        textRuns: removeTextRuns,
        paragraphs: removeParagraphs,
        sectionBreaks: removeSectionBreaks,
        customBlocks: removeCustomBlocks,
        tables: removeTables,
        customRanges: removeCustomRanges,
    };
}

function updateTextRuns(
    body: IDocumentBody,
    updateBody: IDocumentBody,
    textLength: number,
    currentIndex: number,
    coverType: UpdateDocsAttributeType
) {
    const { textRuns } = body;

    const { textRuns: updateDataTextRuns } = updateBody;

    if (textRuns == null || updateDataTextRuns == null) {
        return;
    }

    const removeTextRuns = deleteTextRuns(body, textLength, currentIndex);

    if (coverType !== UpdateDocsAttributeType.REPLACE) {
        const newUpdateTextRun = coverTextRuns(updateDataTextRuns, removeTextRuns, coverType);
        updateBody.textRuns = newUpdateTextRun;
    }

    insertTextRuns(body, updateBody, textLength, currentIndex);

    return removeTextRuns;
}

export function coverTextRuns(
    updateDataTextRuns: ITextRun[],
    removeTextRuns: ITextRun[],
    coverType: UpdateDocsAttributeType
) {
    if (removeTextRuns.length === 0) {
        return updateDataTextRuns;
    }

    updateDataTextRuns = Tools.deepClone(updateDataTextRuns);
    removeTextRuns = Tools.deepClone(removeTextRuns);

    const newUpdateTextRun: ITextRun[] = [];
    const updateLength = updateDataTextRuns.length;
    const removeLength = removeTextRuns.length;
    let updateIndex = 0;
    let removeIndex = 0;
    let pending: Nullable<ITextRun> = null;

    function pushPendingAndReturnStatus() {
        if (pending) {
            newUpdateTextRun.push(pending);
            pending = null;
            return true;
        }

        return false;
    }

    while (updateIndex < updateLength && removeIndex < removeLength) {
        const { st: updateSt, ed: updateEd, ts: updateStyle } = updateDataTextRuns[updateIndex];
        const { st: removeSt, ed: removeEd, ts: removeStyle, sId } = removeTextRuns[removeIndex];
        let newTs;

        if (coverType === UpdateDocsAttributeType.COVER) {
            newTs = { ...removeStyle, ...updateStyle };
        } else {
            newTs = { ...updateStyle, ...removeStyle };
        }

        if (updateEd < removeSt) {
            if (!pushPendingAndReturnStatus()) {
                newUpdateTextRun.push(updateDataTextRuns[updateIndex]);
            }

            updateIndex++;
        } else if (removeEd < updateSt) {
            if (!pushPendingAndReturnStatus()) {
                newUpdateTextRun.push(removeTextRuns[removeIndex]);
            }

            removeIndex++;
        } else {
            newUpdateTextRun.push({
                st: Math.min(updateSt, removeSt),
                ed: Math.max(updateSt, removeSt),
                ts: updateSt < removeSt ? { ...updateStyle } : { ...removeStyle },
                sId: updateSt < removeSt ? undefined : sId,
            });

            newUpdateTextRun.push({
                st: Math.max(updateSt, removeSt),
                ed: Math.min(updateEd, removeEd),
                ts: newTs,
                sId,
            });

            if (updateEd < removeEd) {
                updateIndex++;
                removeTextRuns[removeIndex].st = updateEd;
            } else {
                removeIndex++;
                updateDataTextRuns[updateIndex].st = removeEd;
            }

            pending = {
                st: Math.min(updateEd, removeEd),
                ed: Math.max(updateEd, removeEd),
                ts: updateEd < removeEd ? { ...removeStyle } : { ...updateStyle },
                sId: updateEd < removeEd ? sId : undefined,
            };
        }
    }

    pushPendingAndReturnStatus();

    // If the last textRun is also disjoint, then the last textRun needs to be pushed in `newUpdateTextRun`
    const tempTopTextRun = newUpdateTextRun[newUpdateTextRun.length - 1];
    const updateLastTextRun = updateDataTextRuns[updateLength - 1];
    const removeLastTextRun = removeTextRuns[removeLength - 1];

    if (tempTopTextRun.ed !== Math.max(updateLastTextRun.ed, removeLastTextRun.ed)) {
        if (updateLastTextRun.ed > removeLastTextRun.ed) {
            newUpdateTextRun.push(updateLastTextRun);
        } else {
            newUpdateTextRun.push(removeLastTextRun);
        }
    }

    return normalizeTextRuns(newUpdateTextRun);
}

function updateParagraphs(
    body: IDocumentBody,
    updateBody: IDocumentBody,
    textLength: number,
    currentIndex: number,
    coverType: UpdateDocsAttributeType
) {
    const { paragraphs } = body;

    const { paragraphs: updateDataParagraphs } = updateBody;

    if (paragraphs == null || updateDataParagraphs == null) {
        return;
    }

    const removeParagraphs = deleteParagraphs(body, textLength, currentIndex, true);
    if (coverType !== UpdateDocsAttributeType.REPLACE) {
        const newUpdateParagraphs: IParagraph[] = [];
        for (const updateParagraph of updateDataParagraphs) {
            const {
                startIndex: updateStartIndex,
                paragraphStyle: updateParagraphStyle,
                bullet: updateBullet,
            } = updateParagraph;
            let splitUpdateParagraphs: IParagraph[] = [];
            for (const removeParagraph of removeParagraphs) {
                const {
                    startIndex: removeStartIndex,
                    paragraphStyle: removeParagraphStyle,
                    bullet: removeBullet,
                } = removeParagraph;
                let newParagraphStyle;
                let newBullet;
                if (coverType === UpdateDocsAttributeType.COVER) {
                    newParagraphStyle = { ...removeParagraphStyle, ...updateParagraphStyle };
                    newBullet = { listId: '', nestingLevel: 0, textStyle: {}, ...removeBullet, ...updateBullet };
                } else {
                    newParagraphStyle = { ...updateParagraphStyle, ...removeParagraphStyle };
                    newBullet = { listId: '', nestingLevel: 0, textStyle: {}, ...updateBullet, ...removeBullet };
                }

                if (updateStartIndex === removeStartIndex) {
                    splitUpdateParagraphs.push({
                        startIndex: updateStartIndex,
                        paragraphStyle: newParagraphStyle,
                        bullet: newBullet,
                    });
                    break;
                }
            }
            newUpdateParagraphs.push(...splitUpdateParagraphs);
            splitUpdateParagraphs = [];
        }

        updateBody.paragraphs = newUpdateParagraphs;
    }
    insertParagraphs(body, updateBody, textLength, currentIndex);

    return removeParagraphs;
}

function updateSectionBreaks(
    body: IDocumentBody,
    updateBody: IDocumentBody,
    textLength: number,
    currentIndex: number,
    coverType: UpdateDocsAttributeType
) {
    const { sectionBreaks } = body;

    const { sectionBreaks: updateDataSectionBreaks } = updateBody;

    if (sectionBreaks == null || updateDataSectionBreaks == null) {
        return;
    }

    const removeSectionBreaks = deleteSectionBreaks(body, textLength, currentIndex);
    if (coverType !== UpdateDocsAttributeType.REPLACE) {
        const newUpdateSectionBreaks: ISectionBreak[] = [];
        for (const updateSectionBreak of updateDataSectionBreaks) {
            const { startIndex: updateStartIndex } = updateSectionBreak;
            let splitUpdateSectionBreaks: ISectionBreak[] = [];
            for (const removeSectionBreak of removeSectionBreaks) {
                const { startIndex: removeStartIndex } = removeSectionBreak;
                if (updateStartIndex === removeStartIndex) {
                    if (coverType === UpdateDocsAttributeType.COVER) {
                        splitUpdateSectionBreaks.push({
                            ...removeSectionBreak,
                            ...updateSectionBreak,
                        });
                    } else {
                        splitUpdateSectionBreaks.push({
                            ...updateSectionBreak,
                            ...removeSectionBreak,
                        });
                    }
                    break;
                }
            }
            newUpdateSectionBreaks.push(...splitUpdateSectionBreaks);
            splitUpdateSectionBreaks = [];
        }
        updateBody.sectionBreaks = newUpdateSectionBreaks;
    }
    insertParagraphs(body, updateBody, textLength, currentIndex);

    return removeSectionBreaks;
}

function updateCustomBlocks(
    body: IDocumentBody,
    updateBody: IDocumentBody,
    textLength: number,
    currentIndex: number,
    coverType: UpdateDocsAttributeType
) {
    const { customBlocks } = body;

    const { customBlocks: updateDataCustomBlocks } = updateBody;

    if (customBlocks == null || updateDataCustomBlocks == null) {
        return;
    }

    const removeCustomBlocks = deleteCustomBlocks(body, textLength, currentIndex);
    if (coverType !== UpdateDocsAttributeType.REPLACE) {
        const newUpdateCustomBlocks: ICustomBlock[] = [];
        for (const updateCustomBlock of updateDataCustomBlocks) {
            const { startIndex: updateStartIndex } = updateCustomBlock;
            let splitUpdateCustomBlocks: ICustomBlock[] = [];
            for (const removeCustomBlock of removeCustomBlocks) {
                const { startIndex: removeStartIndex } = removeCustomBlock;
                if (updateStartIndex === removeStartIndex) {
                    if (coverType === UpdateDocsAttributeType.COVER) {
                        splitUpdateCustomBlocks.push({
                            ...removeCustomBlock,
                            ...updateCustomBlock,
                        });
                    } else {
                        splitUpdateCustomBlocks.push({
                            ...updateCustomBlock,
                            ...removeCustomBlock,
                        });
                    }
                    break;
                }
            }
            newUpdateCustomBlocks.push(...splitUpdateCustomBlocks);
            splitUpdateCustomBlocks = [];
        }
        updateBody.customBlocks = newUpdateCustomBlocks;
    }
    insertCustomBlocks(body, updateBody, textLength, currentIndex);

    return removeCustomBlocks;
}

function updateTables(
    body: IDocumentBody,
    updateBody: IDocumentBody,
    textLength: number,
    currentIndex: number,
    coverType: UpdateDocsAttributeType
) {
    const { tables } = body;

    const { tables: updateDataTables } = updateBody;

    if (tables == null || updateDataTables == null) {
        return;
    }

    const removeTables = deleteTables(body, textLength, currentIndex);
    if (coverType !== UpdateDocsAttributeType.REPLACE) {
        const newUpdateTables: ITable[] = [];
        for (const updateTable of updateDataTables) {
            const { startIndex: updateStartIndex, endIndex: updateEndIndex } = updateTable;
            let splitUpdateTables: ITable[] = [];
            for (const removeTable of removeTables) {
                const { startIndex: removeStartIndex, endIndex: removeEndIndex } = removeTable;
                if (removeStartIndex >= updateStartIndex && removeEndIndex <= updateEndIndex) {
                    if (coverType === UpdateDocsAttributeType.COVER) {
                        splitUpdateTables.push({
                            ...removeTable,
                            ...updateTable,
                        });
                    } else {
                        splitUpdateTables.push({
                            ...updateTable,
                            ...removeTable,
                        });
                    }
                    break;
                }
            }
            newUpdateTables.push(...splitUpdateTables);
            splitUpdateTables = [];
        }
        updateBody.tables = newUpdateTables;
    }
    insertTables(body, updateBody, textLength, currentIndex);

    return removeTables;
}

function updateCustomRanges(
    body: IDocumentBody,
    updateBody: IDocumentBody,
    textLength: number,
    currentIndex: number,
    coverType: UpdateDocsAttributeType
) {
    const { customRanges } = body;

    const { tables: updateDataCustomRanges } = updateBody;

    if (customRanges == null || updateDataCustomRanges == null) {
        return;
    }

    const removeCustomRanges = deleteCustomRanges(body, textLength, currentIndex);
    if (coverType !== UpdateDocsAttributeType.REPLACE) {
        const newUpdateCustomRanges: ICustomRange[] = [];
        for (const updateCustomRange of updateDataCustomRanges) {
            const { startIndex: updateStartIndex, endIndex: updateEndIndex } = updateCustomRange;
            let splitUpdateCustomRanges: ICustomRange[] = [];
            for (const removeCustomRange of removeCustomRanges) {
                const { startIndex: removeStartIndex, endIndex: removeEndIndex } = removeCustomRange;
                if (removeStartIndex >= updateStartIndex && removeEndIndex <= updateEndIndex) {
                    if (coverType === UpdateDocsAttributeType.COVER) {
                        splitUpdateCustomRanges.push({
                            ...removeCustomRange,
                            ...updateCustomRange,
                        });
                    } else {
                        splitUpdateCustomRanges.push({
                            ...updateCustomRange,
                            ...removeCustomRange,
                        });
                    }
                    break;
                }
            }
            newUpdateCustomRanges.push(...splitUpdateCustomRanges);
            splitUpdateCustomRanges = [];
        }
        updateBody.customRanges = newUpdateCustomRanges;
    }
    insertTables(body, updateBody, textLength, currentIndex);

    return removeCustomRanges;
}
