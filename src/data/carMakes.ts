/**
 * Car makes and popular models used by the pickers.
 *
 * Picking from a list instead of free typing keeps the data consistent
 * ("BMW" instead of "bmw", "Bmw", "B.M.W."), which is what makes search reliable.
 * The model list is only a suggestion — users can still type a model that's missing.
 *
 * Later this can move into a database table so it can be updated without a new app release.
 */
export const CAR_MAKES: Record<string, string[]> = {
  'Alfa Romeo': ['4C', 'Giulia', 'Giulietta', 'Stelvio', 'Tonale', '147', '156', 'GTV', 'Spider'],
  'Aston Martin': ['DB11', 'DB12', 'DBS', 'DBX', 'Vantage', 'Valkyrie', 'DB5', 'DB9'],
  Audi: ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'R8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'S3', 'S4', 'TT', 'e-tron GT'],
  Bentley: ['Bentayga', 'Continental GT', 'Flying Spur', 'Mulsanne'],
  BMW: ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '7 Series', '8 Series', 'i4', 'i8', 'iX', 'M2', 'M3', 'M4', 'M5', 'M8', 'X3', 'X5', 'X5 M', 'X6', 'X6 M', 'Z4'],
  Bugatti: ['Chiron', 'Divo', 'Tourbillon', 'Veyron'],
  Cadillac: ['CT5', 'Escalade', 'Lyriq'],
  Chevrolet: ['Camaro', 'Corvette', 'Silverado', 'Tahoe'],
  Citroën: ['C3', 'C4', 'C5', 'DS3', '2CV'],
  Dacia: ['Duster', 'Logan', 'Sandero', 'Spring'],
  Dodge: ['Challenger', 'Charger', 'Durango', 'Viper', 'RAM'],
  Ferrari: ['296 GTB', '488', '812 Superfast', 'F40', 'F8 Tributo', 'LaFerrari', 'Purosangue', 'Roma', 'SF90 Stradale', '12Cilindri'],
  Fiat: ['500', '500 Abarth', 'Panda', 'Punto', 'Tipo'],
  Ford: ['Bronco', 'Fiesta', 'Fiesta ST', 'Focus', 'Focus RS', 'Focus ST', 'GT', 'Mustang', 'Raptor', 'Ranger'],
  Honda: ['Civic', 'Civic Type R', 'CR-V', 'Integra', 'NSX', 'S2000', 'Accord'],
  Hyundai: ['i20 N', 'i30 N', 'Ioniq 5', 'Ioniq 5 N', 'Kona', 'Tucson'],
  Jaguar: ['E-Type', 'F-Pace', 'F-Type', 'XE', 'XF'],
  Jeep: ['Cherokee', 'Grand Cherokee', 'Wrangler'],
  Kia: ['EV6', 'Sportage', 'Stinger', 'Ceed'],
  Koenigsegg: ['Agera', 'Gemera', 'Jesko', 'Regera'],
  Lamborghini: ['Aventador', 'Countach', 'Diablo', 'Huracán', 'Murciélago', 'Revuelto', 'Temerario', 'Urus'],
  'Land Rover': ['Defender', 'Discovery', 'Range Rover', 'Range Rover Sport', 'Range Rover Velar'],
  Lexus: ['IS', 'LC', 'LFA', 'NX', 'RX'],
  Lotus: ['Elise', 'Emira', 'Evija', 'Exige'],
  Maserati: ['Ghibli', 'GranTurismo', 'Levante', 'MC20', 'Quattroporte'],
  Mazda: ['CX-5', 'Mazda3', 'MX-5', 'RX-7', 'RX-8'],
  McLaren: ['570S', '720S', '750S', 'Artura', 'P1', 'Senna'],
  'Mercedes-Benz': ['A-Class', 'AMG GT', 'C-Class', 'C63 AMG', 'CLA', 'E-Class', 'E63 AMG', 'G-Class', 'G63 AMG', 'GLE', 'S-Class', 'SL', 'SLS AMG'],
  Mini: ['Cooper', 'Cooper S', 'John Cooper Works', 'Countryman'],
  Mitsubishi: ['Lancer Evolution', 'Eclipse', 'Pajero', '3000GT'],
  Nissan: ['350Z', '370Z', 'GT-R', 'Patrol', 'Qashqai', 'Silvia', 'Skyline', 'Z'],
  Opel: ['Astra', 'Corsa', 'Insignia', 'Calibra'],
  Peugeot: ['208', '308', '508', '205 GTI'],
  Porsche: ['718 Boxster', '718 Cayman', '911', '911 GT3', '911 GT3 RS', '911 Turbo S', '918 Spyder', 'Carrera GT', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  Renault: ['Clio', 'Clio RS', 'Megane', 'Megane RS', 'Alpine A110'],
  'Rolls-Royce': ['Cullinan', 'Ghost', 'Phantom', 'Spectre', 'Wraith'],
  SEAT: ['Ibiza', 'Leon', 'Leon Cupra', 'Cupra Formentor'],
  Škoda: ['Fabia', 'Kodiaq', 'Octavia', 'Octavia RS', 'Superb'],
  Subaru: ['BRZ', 'Forester', 'Impreza WRX', 'WRX STI', 'Outback'],
  Suzuki: ['Jimny', 'Swift', 'Swift Sport', 'Vitara'],
  Tesla: ['Cybertruck', 'Model 3', 'Model S', 'Model X', 'Model Y', 'Roadster'],
  Toyota: ['GR86', 'GR Supra', 'GR Yaris', 'Land Cruiser', 'Corolla', 'Celica', 'MR2', 'RAV4', 'Supra'],
  Volkswagen: ['Arteon', 'Golf', 'Golf GTI', 'Golf R', 'Passat', 'Polo', 'Polo GTI', 'Scirocco', 'Tiguan', 'Touareg'],
  Volvo: ['240', 'EX30', 'S60', 'V60', 'XC40', 'XC60', 'XC90'],
};

/** Sorted list of makes, for the make picker. */
export const MAKE_NAMES = Object.keys(CAR_MAKES).sort((a, b) => a.localeCompare(b));
