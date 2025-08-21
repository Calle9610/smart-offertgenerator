/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      mockApiResponse(method: string, url: string, response: any): Chainable<null>
      waitForLoading(): Chainable<null>
      shouldBeSelected(selector: string): Chainable<JQuery<HTMLElement>>
      shouldNotBeSelected(selector?: string): Chainable<JQuery<HTMLElement>>
      shouldBeVisibleAndContain(selector: string, text: string): Chainable<JQuery<HTMLElement>>
      selectRadioOption(groupName: string, optionValue: string): Chainable<JQuery<HTMLElement>>
      toggleCheckbox(selector: string): Chainable<JQuery<HTMLElement>>
      verifyPdfDownload(filename?: string): Chainable<null>
      checkOptionGroupBehavior(groupName: string, selectedOption: string): Chainable<null>
      waitForApi(method: string, url: string): Chainable<null>
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>
      checkTotalsUpdate(base: string, optional: string, total: string): Chainable<null>
    }
  }
}

export {}
