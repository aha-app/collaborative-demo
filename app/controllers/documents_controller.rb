class DocumentsController < ApplicationController
  def edit
    @document = Document.find(params[:id])
  end
end
