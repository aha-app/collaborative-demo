class OperationsChannel < ApplicationCable::Channel
  def subscribed
    @client_id = params[:client_id]
    @document = Document.find(params[:document_id])
    stream_from broadcast_key
    stream_from client_key
  end

  def operations(data)
    send_operations_since(data["version"])
  end

  def submit(data)
    @document.reload
    operation = @document.operations.build(operation_params(data))
    @document.apply(operation)
    @document.save!

    ActionCable.server.broadcast(client_key, {type: "ack", message: operation})
    ActionCable.server.broadcast(broadcast_key, {type: "op", client_id: @client_id, message: [operation]})
  rescue => e
    ActionCable.server.broadcast(client_key, {type: "error", message: e.message})
  end

  private

  def send_operations_since(version)
    operations = @document.operations.where("version >= ?", version).order("version")
    ActionCable.server.broadcast(client_key, { type: "op", message: operations.to_a })
  end

  def broadcast_key
    "document:#{@document.id}:operations"
  end

  def client_key
    "document:#{@document.id}:operations_#{@client_id}"
  end

  def operation_params(params)
    params["operation"]
  end
end
