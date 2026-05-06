// Shared shape passed from card detail server page to the view components.
export type CardViewModel = {
  id: number;
  type: string;
  state: string;
  reasonForVisit: string;
  slotDatetime: string | null;
  durationMin: number;
  patientConfirmedAt: string | null;
  patient: { name: string; phone: string };
  doctor: { id: number; name: string };
  parentCardId: number | null;
};
