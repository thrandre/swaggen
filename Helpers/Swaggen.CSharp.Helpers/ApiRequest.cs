using System.Collections.Generic;
using System.Net.Http;

// ReSharper disable UnusedTypeParameter
namespace Swaggen.CSharp.Helpers
{
    public interface IApiRequest
    {
        string ApiName { get; }
        string Uri { get; }
        HttpMethod Method { get; }
        IDictionary<string, object> Query { get; set; }
        object Body { get; set; }
    }

    public class ApiRequest : IApiRequest
    {
        public ApiRequest(string apiName, string uri, HttpMethod method)
        {
            ApiName = apiName;
            Uri = uri;
            Method = method;
        }

        public string ApiName { get; }
        public string Uri { get; }
        public HttpMethod Method { get; }
        public IDictionary<string, object> Query { get; set; }
        public object Body { get; set; }
    }

    public interface IApiRequest<out TResult> : IApiRequest { }

    public class ApiRequest<TResult> : ApiRequest, IApiRequest<TResult>
    {
        public ApiRequest(string apiName, string uri, HttpMethod method) : base(apiName, uri, method) { }
    }
}