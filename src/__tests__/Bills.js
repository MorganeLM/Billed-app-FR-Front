/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from '../containers/Bills.js'
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";

import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
// mock like on Dashboard.js
jest.mock("../app/store", () => mockStore);
// mockImplementation
// window.$ = jest.fn().mockImplementation(() => {
//   return {
//     click: jest.fn(),
//     width: jest.fn(),
//     find: jest.fn().mockImplementation(() => {
//       return {
//         HTMLElement: `<div class="modal-body">
//         </div>`,
//         html: jest.fn(),
//       };
//     }),
//     modal: jest.fn().mockImplementation(() => {
//       return {
//         click: jest.fn(),
//       };
//     }),
//   };
// });

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      //expect(windowIcon).toHaveClass('active-icon')
      expect(windowIcon.getAttribute("class")).toContain("active-icon");
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I am on Bills Page and I click on eye icon", () => {
    test("Then the bill modal (opens)is present", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      //const iconEye = screen.getAllByTestId("icon-eye");
      //userEvent.click(iconEye[0]);
      expect(screen.getByTestId("bill-modal-title").textContent).toEqual("Justificatif");
    })

    test("Then modal opens and contain an image", async () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const mockedBill = new Bills({ document, onNavigate, firestore: null, bills, localStorage: localStorageMock })          
      jQuery.fn.modal = jest.fn()
      const iconEye = screen.getAllByTestId('icon-eye')[0]
      //before clicking no image
      expect(screen.findByAltText('Bill')).not.toBeDefined;
      const handleClickIconEye = jest.fn(() => mockedBill.handleClickIconEye(iconEye))
      iconEye.addEventListener('click', handleClickIconEye)
      userEvent.click(iconEye)
      const image = await screen.findByAltText('Bill')
      // after clicking image
      expect(image.getAttribute('src')).toBeDefined;
    })
  })
})



// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bill", () => {

  })
})