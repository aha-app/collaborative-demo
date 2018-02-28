class SelectionsChannel < ApplicationCable::Channel
  def subscribed
    @client_id = params[:client_id]
    @document_id = params[:document_id]
    stream_from broadcast_key
  end

  def set_offset(data)
    ActionCable.server.broadcast(broadcast_key, data)
  end

  private
  def broadcast_key
    "document:#{@document_id}:selections"
  end
end
