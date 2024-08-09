import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    poNo: { type: String, required: true },
    materialCode: { type: String, default: '-' },
    studItemDescription: { type: String, required: true },
    nutItemDescription: { type: String, required: true },
    selectedItem: { type: String, required: true },
    selectedSurface: { type: String, required: true },
    studGrade: { type: String, required: true },
    nutGrade: { type: String, required: true },

    POsize: {
        diameter: {
            value: { type: String, required: true },
            dimension: { type: String, required: true }
        },
        thread: { type: String, required: true },
        length: {
            value: { type: String, required: true },
            dimension: { type: String, required: true }
        },
        lengthInch: {
            value: { type: String, required: true },
            dimension: { type: String, required: true }
        }
    },

    Cuttingsize: {
        cuttingdiameter: {
            value: { type: String, required: true }
        },
        cuttingthread: { type: String, required: true },
        cuttinglength: {
            value: { type: String, required: true }
        },
        quantity: { type: Number, required: true }
    },

    attachment: {
        path: { type: String, required: true },
        fileName: { type: String, required: true }
    },

    createdAt: { type: Date, default: Date.now },
    orderDate: { type: Date, required: true },
    createdBy: { type: String, required: true },
    sono: { type: String, required: true },
    sonoDate: { type: Date, required: true },
    itpNo: { type: String, default: '-' },
    itpRevNo: { type: String, default: '-' },
    drawingNo: { type: String, default: '-' },
    drawingRevNo: { type: String, default: '-' },
    heatNo: { type: String, required: true },
    __v: { type: Number, select: false } // Version key, typically used by Mongoose
});

const testModel = mongoose.model("test", testSchema);

export {testModel};
