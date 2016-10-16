import { AdresseViewModel } from "./AdresseViewModel";

export interface SkoleViewModel {
	id: number;
	navn: string;
	organisasjonsnummer: string;
	skoletype: string;
	telefonnummer: string;
	epost: string;
	webadresse: string;
	postadresse: AdresseViewModel;
	besoksadresse: AdresseViewModel;
	kommunenavn: string;
	fylkesnavn: string;
	brukerstotteansvarlig: string;
}
