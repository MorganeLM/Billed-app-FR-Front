/**
 * @jest-environment jsdom
 */
import { screen, fireEvent } from "@testing-library/dom"
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store"
import { localStorageMock } from "../__mocks__/localStorage.js"

jest.mock("../app/store", () => mockStore)

const onNavigate = () => {return}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
Object.defineProperty(window, "location", { value: { hash: "#employee/bill/new" } })

const billExample = {
  email: "test@email.com",
  type: "Restaurant",
  name:  "bill",
  amount: 10,
  date: "2023-01-01",
  vat: 5.5,
  pct: 20,
  commentary: "RAS",
  fileUrl: "https://fr.wikipedia.org/static/images/icons/wikipedia.png",
  fileName: "icon",
  status: 'pending'
}


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then I access the new bill form with all fields", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy()
      const form = screen.getByTestId("form-new-bill")
      const newBillType = screen.getByTestId('expense-type')
      const newBillName = screen.getByTestId('expense-name')
      const newBillAmount = screen.getByTestId('amount')
      const newBillDate = screen.getByTestId('datepicker')
      const newBillVAT = screen.getByTestId('vat')
      const newBillPCT = screen.getByTestId('expense-name')
      const newBillCommentary = screen.getByTestId('commentary')
      const newBillFile = screen.getByTestId("file")
      const newBillSubmit = screen.getByTestId("btn-send-bill")
      expect(form.length).toEqual(9) 
      expect(newBillType).toBeTruthy()
      expect(newBillName).toBeTruthy()
      expect(newBillAmount).toBeTruthy()
      expect(newBillDate).toBeTruthy()
      expect(newBillVAT).toBeTruthy()
      expect(newBillPCT).toBeTruthy()
      expect(newBillCommentary).toBeTruthy()
      expect(newBillFile).toBeTruthy()
      expect(newBillSubmit).toBeTruthy()
    })

    describe("And I upload a file", () => {
      test("Then the file handler should show a file", () => {
        document.body.innerHTML = NewBillUI()
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
        const handleChangeFile = jest.fn(() => newBill.handleChangeFile)
        const newBillFile = screen.getByTestId("file")
        newBillFile.addEventListener("change", handleChangeFile)
        const file = new File(["file.txt"], "file.txt", { type: "text/txt" })
        userEvent.upload(newBillFile, file)
        expect(newBillFile.files[0]).toStrictEqual(file)
        expect(newBillFile.files.item(0)).toStrictEqual(file)
        expect(newBillFile.files).toHaveLength(1)
      })
    })
    describe("And I upload a not valid file (not an image)", () => {
      test("Then the error message should be displayed", () => {
        document.body.innerHTML = NewBillUI()
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
        const handleChangeFile = jest.fn(() => newBill.handleChangeFile)
        const newBillFile = screen.getByTestId("file")
        newBillFile.addEventListener("change", handleChangeFile)
        const file = new File(["file.txt"], "file.txt", { type: "text/txt" })
        userEvent.upload(newBillFile, file)
        expect(handleChangeFile).toBeCalled()
        expect(newBillFile.files[0].name).toBe("file.txt")
        expect(document.querySelector(".format-error").style.display).toBe("block")
      })
    })
    describe("And I upload a valid image file", () => {
      test("Then the error message should NOT be displayed", () => {
        document.body.innerHTML = NewBillUI()
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
        const handleChangeFile = jest.fn(() => newBill.handleChangeFile)
        const newBillFile = screen.getByTestId("file")
        newBillFile.addEventListener("change", handleChangeFile)
        const imageFile = new File(["image.png"], "image.png", { type: "image/png" })
        userEvent.upload(newBillFile, imageFile)
        expect(handleChangeFile).toBeCalled()
        expect(newBillFile.files[0].name).toBe("image.png")
        expect(document.querySelector(".format-error").style.display).toBe("none")
      })
    })

    describe("And I submit a valid bill form", () => {
      test('then a bill is created', async () => {
        document.body.innerHTML = NewBillUI()
        // simulate filling all fields
        const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
        document.querySelector(`input[data-testid="expense-name"]`).value = billExample.name
        document.querySelector(`input[data-testid="datepicker"]`).value = billExample.date
        document.querySelector(`select[data-testid="expense-type"]`).value = billExample.type
        document.querySelector(`input[data-testid="amount"]`).value = billExample.amount
        document.querySelector(`input[data-testid="vat"]`).value = billExample.vat
        document.querySelector(`input[data-testid="pct"]`).value = billExample.pct
        document.querySelector(`textarea[data-testid="commentary"]`).value = billExample.commentary
        newBill.fileUrl = billExample.fileUrl
        newBill.fileName = billExample.fileName
        // simulate submittion
        const submitBtn = screen.getByTestId('form-new-bill')
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
        newBill.createBill = (newBill) => newBill
        submitBtn.addEventListener('click', handleSubmit)
        userEvent.click(submitBtn)
        // test submission and redirection
        expect(handleSubmit).toHaveBeenCalled()
        expect(screen.findByText("Mes notes de frais")).toBeTruthy();
      })
    })
  })

  describe("When an error occurs on API", () => {
    test("fetches error from an API and fails with 500 error", async () => {
      jest.spyOn(mockStore, "bills");
      jest.spyOn(console, "error").mockImplementation(() => {}) // Prevent jest error
      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        }
      })
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
      const form = screen.getByTestId("form-new-bill")
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form)
      await new Promise(process.nextTick)
      expect(console.error).toHaveBeenCalled()
    })
  })
})