Rails.application.routes.draw do
  resources :documents, only: :edit
  root "documents#edit", id: 1
end
