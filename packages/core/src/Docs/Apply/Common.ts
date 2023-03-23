import {
    IBlockElement,
    IDocumentData,
    IElement,
    ITextRun,
} from '../../Interfaces/IDocumentData';

export function getTextIndexByCursor(index: number, isBack: boolean = false) {
    return isBack ? index - 1 : index;
}

export function insertTextToContent(content: string, start: number, text: string) {
    return content.slice(0, start) + text + content.slice(start);
}

export function deleteContent(content: string, start: number, end: number) {
    if (start > end) {
        return content;
    }
    return content.slice(0, start) + content.slice(end);
}

export function moveElementCharIndex(element?: IElement, moveIndex: number = 0) {
    if (element == null) {
        return;
    }

    element.st += moveIndex;
    element.ed += moveIndex;
}

export function moveBlockCharIndex(
    blockElement?: IBlockElement,
    moveIndex: number = 0
) {
    if (blockElement == null) {
        return;
    }

    blockElement.st += moveIndex;
    blockElement.ed += moveIndex;
}

export function getDocsUpdateBody(model: IDocumentData, segmentId?: string) {
    let body = model.body;

    if (segmentId) {
        const { headers, footers } = model;
        if (headers?.[segmentId]) {
            body = headers[segmentId].body;
        } else if (footers?.[segmentId]) {
            body = footers[segmentId].body;
        }
    }

    return body;
}

export function isSameStyleTextRun(tr1: ITextRun, tr2: ITextRun) {
    return false;
}

export function mergeSameTextRun(mainTr: ITextRun, mergeTr: ITextRun) {
    const isSame = isSameStyleTextRun(mainTr, mergeTr);
}
