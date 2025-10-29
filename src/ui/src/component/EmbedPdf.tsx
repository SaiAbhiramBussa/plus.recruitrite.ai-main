export default function PdfPreview({ pdfUrl }: any){
  return (
    <div className="w-1/2 overflow-auto">
      <iframe src={pdfUrl} width="100%" height="100%" />
    </div>
  );
};

