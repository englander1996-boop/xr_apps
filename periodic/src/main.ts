import { createEvenApp, lines } from '../../_lib/even'
import { setupPreview } from '../../_lib/preview'

const ELEMENTS: [string, string][] = [
  ['H','Hydrogen'],['He','Helium'],['Li','Lithium'],['Be','Beryllium'],['B','Boron'],['C','Carbon'],['N','Nitrogen'],['O','Oxygen'],['F','Fluorine'],['Ne','Neon'],
  ['Na','Sodium'],['Mg','Magnesium'],['Al','Aluminum'],['Si','Silicon'],['P','Phosphorus'],['S','Sulfur'],['Cl','Chlorine'],['Ar','Argon'],['K','Potassium'],['Ca','Calcium'],
  ['Sc','Scandium'],['Ti','Titanium'],['V','Vanadium'],['Cr','Chromium'],['Mn','Manganese'],['Fe','Iron'],['Co','Cobalt'],['Ni','Nickel'],['Cu','Copper'],['Zn','Zinc'],
  ['Ga','Gallium'],['Ge','Germanium'],['As','Arsenic'],['Se','Selenium'],['Br','Bromine'],['Kr','Krypton'],['Rb','Rubidium'],['Sr','Strontium'],['Y','Yttrium'],['Zr','Zirconium'],
  ['Nb','Niobium'],['Mo','Molybdenum'],['Tc','Technetium'],['Ru','Ruthenium'],['Rh','Rhodium'],['Pd','Palladium'],['Ag','Silver'],['Cd','Cadmium'],['In','Indium'],['Sn','Tin'],
  ['Sb','Antimony'],['Te','Tellurium'],['I','Iodine'],['Xe','Xenon'],['Cs','Cesium'],['Ba','Barium'],['La','Lanthanum'],['Ce','Cerium'],['Pr','Praseodymium'],['Nd','Neodymium'],
  ['Pm','Promethium'],['Sm','Samarium'],['Eu','Europium'],['Gd','Gadolinium'],['Tb','Terbium'],['Dy','Dysprosium'],['Ho','Holmium'],['Er','Erbium'],['Tm','Thulium'],['Yb','Ytterbium'],
  ['Lu','Lutetium'],['Hf','Hafnium'],['Ta','Tantalum'],['W','Tungsten'],['Re','Rhenium'],['Os','Osmium'],['Ir','Iridium'],['Pt','Platinum'],['Au','Gold'],['Hg','Mercury'],
  ['Tl','Thallium'],['Pb','Lead'],['Bi','Bismuth'],['Po','Polonium'],['At','Astatine'],['Rn','Radon'],['Fr','Francium'],['Ra','Radium'],['Ac','Actinium'],['Th','Thorium'],
  ['Pa','Protactinium'],['U','Uranium'],['Np','Neptunium'],['Pu','Plutonium'],['Am','Americium'],['Cm','Curium'],['Bk','Berkelium'],['Cf','Californium'],['Es','Einsteinium'],['Fm','Fermium'],
  ['Md','Mendelevium'],['No','Nobelium'],['Lr','Lawrencium'],['Rf','Rutherfordium'],['Db','Dubnium'],['Sg','Seaborgium'],['Bh','Bohrium'],['Hs','Hassium'],['Mt','Meitnerium'],['Ds','Darmstadtium'],
  ['Rg','Roentgenium'],['Cn','Copernicium'],['Nh','Nihonium'],['Fl','Flerovium'],['Mc','Moscovium'],['Lv','Livermorium'],['Ts','Tennessine'],['Og','Oganesson'],
]
let idx = 0

const preview = setupPreview({
  title: 'Periodic',
  subtitle: 'Tap=next, double=random',
  buttons: [
    { id: 'next', label: 'Next', onClick: () => { idx = (idx + 1) % ELEMENTS.length; render() } },
    { id: 'rand', label: 'Random', variant: 'secondary', onClick: () => { idx = Math.floor(Math.random() * ELEMENTS.length); render() } },
  ],
})
const app = await createEvenApp()
app.setLogger((l) => preview.log(l))
preview.setStatus(app.connected ? 'Connected' : 'Bridge unavailable (preview only)')
app.on('click', () => { idx = (idx + 1) % ELEMENTS.length; render() })
app.on('double', () => { idx = Math.floor(Math.random() * ELEMENTS.length); render() })

function render() {
  const [sym, name] = ELEMENTS[idx]
  preview.setContent(`${idx + 1}  ${sym}\n${name}`)
  void app.render(lines(`${idx + 1}  ${sym}`, name))
}
render()
