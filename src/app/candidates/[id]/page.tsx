import { CandidateDetail } from "@/components/candidates/candidate-detail";

export default function CandidateDetailPage({ params }: { params: { id: string } }) {
  return <CandidateDetail candidateId={params.id} />;
}
