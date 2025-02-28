/**
 * @jest-environment jsdom
 */
import {screen, waitFor} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import Bills from '../containers/Bills.js'
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
// mock like on Dashboard.js
jest.mock("../app/store", () => mockStore);
const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) }

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
    test("Then the bill modal is present", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      //const iconEye = screen.getAllByTestId("icon-eye");
      //userEvent.click(iconEye[0]);
      expect(screen.getByTestId("bill-modal-title").textContent).toEqual("Justificatif");
    })

    test("Then modal opens and contains an image", async () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const mockedBills = new Bills({ document, onNavigate, firestore: null, bills, localStorage: localStorageMock })          
      jQuery.fn.modal = jest.fn()
      const firstIconEye = screen.getAllByTestId('icon-eye')[0]
      //before clicking no image
      expect(screen.queryByAltText('Bill')).toBeNull();
      const handleClickIconEye = jest.fn(() => mockedBills.handleClickIconEye(firstIconEye))
      firstIconEye.addEventListener('click', handleClickIconEye)
      userEvent.click(firstIconEye)
      const image = await screen.findByAltText('Bill')
      // after clicking image
      expect(image.getAttribute('src')).toBeDefined();
    })
  })

  describe("When I am on Bills Page and the page is loading", () => {
    test("Then It should renders the loading page", () => {
      const html = BillsUI({ loading: true }) 
      document.body.innerHTML = html
      const loading = screen.getByText('Loading...');
      expect(loading).toBeTruthy()
    })
  })

  describe("When I am on Bills Page and I click on new bill icon", () => {
    test("Then it should redirect to new bill page", () => {
      const html = BillsUI({ data: bills }) 
      document.body.innerHTML = html
      const mockedBills = new Bills({ document, onNavigate, firestore: null, bills, localStorage: localStorageMock})          
      const handleClickNewBill = jest.fn((e) => mockedBills.handleClickNewBill(e, bills)) 
      const newBillBtn = screen.getByTestId(`btn-new-bill`)
      newBillBtn.addEventListener('click', handleClickNewBill)
      userEvent.click(newBillBtn)
      expect(handleClickNewBill).toHaveBeenCalled()
      //expect(window.location.href).toEqual("http://localhost/#employee/bill/new")
    })
  })

})



// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("Then bills from mock API GET should be displayed", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      const billsPageTitle = screen.getByText("Mes notes de frais");
      expect(billsPageTitle).toBeTruthy()
      const newBillBtn  = screen.getByTestId("btn-new-bill")
      expect(newBillBtn).toBeTruthy()
      const billTable  = screen.getByTestId("tbody")
      expect(billTable).toBeTruthy()
      const billNames = screen.getAllByTestId("bill-name").map((billNameElt) => billNameElt.innerHTML)
      expect(billNames.length).toBe(4)
      expect(billNames).toContain("encore")
      expect(billNames).toContain("test1")
      expect(billNames).toContain("test2")
      expect(billNames).toContain("test3")
    })


    // idem as in Dashboard 
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
            window,
            'localStorage',
            { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "a@a"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })

      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }})
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }})
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })

  })
})

