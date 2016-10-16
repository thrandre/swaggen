import { AdresseViewModel } from "./AdresseViewModel";

export interface FylkesmannViewModel {
	id: number;
	navn: string;
	organisasjonsnummer: string;
	epost: string;
	telefon: string;
	postadresse: AdresseViewModel;
	besøksadresse: AdresseViewModel;
}
