import { Tools } from '../../shared/tools';
import { IDocumentData, IDocumentRenderConfig } from '../../types/interfaces/i-document-data';
import { IPaddingData } from '../../types/interfaces/i-style-data';
import { DocumentBodyModel } from './document-body-model';

export const DEFAULT_DOC = {
    id: 'default_doc',
    documentStyle: {},
};

interface IDrawingUpdateConfig {
    left: number;
    top: number;
    height: number;
    width: number;
}

export type DocumentModelOrSimple = DocumentModelSimple | DocumentModel;

export class DocumentModelSimple {
    snapshot: IDocumentData;

    headerTreeMap!: Map<string, DocumentBodyModel>; // sub class should guarantee this is not null

    footerTreeMap!: Map<string, DocumentBodyModel>; // sub class should guarantee this is not null

    bodyModel!: DocumentBodyModel; // sub class should guarantee this is not null

    constructor(snapshot: Partial<IDocumentData>) {
        this.snapshot = { ...DEFAULT_DOC, ...snapshot };

        if (this.snapshot.body != null) {
            this.bodyModel = DocumentBodyModel.create(this.snapshot.body);
        }
    }

    get drawings() {
        return this.snapshot.drawings;
    }

    get documentStyle() {
        return this.snapshot.documentStyle;
    }

    get lists() {
        return this.snapshot.lists;
    }

    get body() {
        return this.snapshot.body;
    }

    get zoomRatio() {
        return this.snapshot.settings?.zoomRatio || 1;
    }

    dispose() {
        this.bodyModel.dispose();

        this.headerTreeMap.forEach((headerTree) => {
            headerTree.dispose();
        });

        this.footerTreeMap.forEach((footerTree) => {
            footerTree.dispose();
        });
    }

    getShouldRenderLoopImmediately() {
        const should = this.snapshot.shouldStartRenderingImmediately;

        return should !== false;
    }

    getContainer() {
        return this.snapshot.container;
    }

    getParentRenderUnitId() {
        return this.snapshot.parentRenderUnitId;
    }

    getBodyModel(segmentId?: string) {
        if (segmentId == null) {
            return this.bodyModel;
        }

        if (this.headerTreeMap.has(segmentId)) {
            return this.headerTreeMap.get(segmentId)!;
        }

        if (this.footerTreeMap.has(segmentId)) {
            return this.footerTreeMap.get(segmentId)!;
        }

        return this.bodyModel;
    }

    getSnapshot() {
        return this.snapshot;
    }

    updateDocumentId(unitId: string) {
        this.snapshot.id = unitId;
    }

    updateDocumentRenderConfig(config: IDocumentRenderConfig) {
        const { documentStyle } = this.snapshot;

        if (documentStyle.renderConfig == null) {
            documentStyle.renderConfig = config;
        } else {
            documentStyle.renderConfig = {
                ...documentStyle.renderConfig,
                ...config,
            };
        }
    }

    updateDocumentDataMargin(data: IPaddingData) {
        const { t, l, b, r } = data;
        const { documentStyle } = this.snapshot;

        if (t != null) {
            documentStyle.marginTop = t;
        }

        if (l != null) {
            documentStyle.marginLeft = l;
        }

        if (b != null) {
            documentStyle.marginBottom = b;
        }

        if (r != null) {
            documentStyle.marginRight = r;
        }
    }

    updateDocumentDataPageSize(width?: number, height?: number) {
        const { documentStyle } = this.snapshot;

        if (!documentStyle.pageSize) {
            width = width ?? Infinity;
            height = height ?? Infinity;
            documentStyle.pageSize = {
                width,
                height,
            };

            return;
        }

        if (width !== undefined) {
            documentStyle.pageSize.width = width;
        }

        if (height !== undefined) {
            documentStyle.pageSize.height = height;
        }
    }

    updateDrawing(id: string, config: IDrawingUpdateConfig) {
        const { drawings } = this;
        const { width, height, left, top } = config;
        const drawing = drawings?.[id];

        if (!drawing) {
            return;
        }

        const objectTransform = drawing.objectTransform;

        objectTransform.size.width = config.width;
        objectTransform.size.height = config.height;

        objectTransform.positionH.posOffset = config.left;
        objectTransform.positionV.posOffset = config.top;
    }

    setZoomRatio(zoomRatio: number = 1) {
        if (this.snapshot.settings == null) {
            this.snapshot.settings = {
                zoomRatio,
            };
        } else {
            this.snapshot.settings.zoomRatio = 1;
        }
    }
}

const UNIT_ID_LENGTH = 6;

export class DocumentModel extends DocumentModelSimple {
    private _unitId: string;

    constructor(snapshot: Partial<IDocumentData>) {
        super(snapshot);

        this._unitId = this.snapshot.id ?? Tools.generateRandomId(UNIT_ID_LENGTH);
        this._initializeRowColTree();
    }

    getRev(): number {
        return this.snapshot.rev ?? 0;
    }

    incrementRev(): void {
        this.snapshot.rev = this.getRev() + 1;
    }

    getSettings() {
        return this.snapshot.settings;
    }

    reset(snapshot: Partial<IDocumentData>) {
        if (snapshot.id && snapshot.id !== this._unitId) {
            throw new Error('Cannot reset a document model with a different unit id!');
        }

        this.snapshot = { ...DEFAULT_DOC, ...snapshot };
        this._initializeRowColTree();
        this.bodyModel.reset(snapshot.body ?? { dataStream: '\r\n' });
    }

    getUnitId(): string {
        return this._unitId;
    }

    override updateDocumentId(unitId: string) {
        super.updateDocumentId(unitId);
        this._unitId = unitId;
    }

    // TODO: @jocs The function name and content don't match?
    private _initializeRowColTree() {
        this.headerTreeMap = new Map();
        this.footerTreeMap = new Map();

        const { headers, footers } = this.snapshot;

        if (headers) {
            for (const headerId in headers) {
                const header = headers[headerId];
                this.headerTreeMap.set(headerId, DocumentBodyModel.create(header.body));
            }
        }

        if (footers) {
            for (const footerId in footers) {
                const footer = footers[footerId];
                this.footerTreeMap.set(footerId, DocumentBodyModel.create(footer.body));
            }
        }
    }
}

export const DEFAULT_EMPTY_DOCUMENT_VALUE = '\r\n';

export function createEmptyDocSnapshot(): Partial<IDocumentData> {
    return {
        body: {
            dataStream: DEFAULT_EMPTY_DOCUMENT_VALUE,
        },
    };
}
