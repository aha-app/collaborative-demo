require 'test_helper'

class DocumentsControllerTest < ActionDispatch::IntegrationTest
  test "should get edit" do
    get edit_document_url(documents(:first))
    assert_response :success
  end
end
