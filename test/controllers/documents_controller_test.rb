require 'test_helper'

class DocumentsControllerTest < ActionDispatch::IntegrationTest
  test "should get edit" do
    get documents_edit_url
    assert_response :success
  end

end
